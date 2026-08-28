import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Landing from '../components/Landing';
import { fbTrack, fbTrackCustom, fbTrackPurchaseOnce } from '../lib/fbpixel';
import type { DeepReport } from '../components/Report';
import {
  clearProgress,
  getToken,
  loadFinished,
  loadProgress,
  ping,
  saveFinished,
} from '../lib/tracker';
import { ASSESSMENT_QUESTIONS } from '../lib/assessment';
import { getAge, type Answers } from '../lib/engine';
import { trpc } from '@/providers/trpc';

const loadQuiz = () => import('../components/Quiz');
const loadAnalyzing = () => import('../components/Analyzing');
const loadReport = () => import('../components/Report');

const Quiz = lazy(loadQuiz);
const Analyzing = lazy(loadAnalyzing);
const Report = lazy(loadReport);

type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';
type Notice = { tone: 'success' | 'warning' | 'error'; text: string } | null;

function StageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf5ef]" role="status" aria-label="Loading Revela">
      <div className="h-8 w-8 animate-pulse rounded-full bg-[#751545]/20" />
    </div>
  );
}

function resumeStep(savedStep: number, answers: Answers): number {
  const firstUnanswered = ASSESSMENT_QUESTIONS.findIndex((question) => !answers[question.id]);
  if (firstUnanswered >= 0) return firstUnanswered;
  return Math.max(0, Math.min(savedStep, ASSESSMENT_QUESTIONS.length - 1));
}

type InitialHomeState = {
  stage: Stage;
  answers: Answers;
  initialStep: number;
  resumeAvailable: boolean;
  deepReport: DeepReport | null;
  notice: Notice;
};

function readInitialHomeState(): InitialHomeState {
  const saved = loadProgress();
  const finished = loadFinished();
  const params = new URLSearchParams(window.location.search);
  const returningFromCheckout = Boolean(params.get('session_id') || params.get('checkout'));

  if (returningFromCheckout && finished && Object.keys(finished.answers).length > 0) {
    return {
      stage: 'report',
      answers: finished.answers,
      initialStep: 0,
      resumeAvailable: false,
      deepReport: finished.deep as DeepReport | null,
      notice:
        params.get('checkout') === 'cancelled'
          ? { tone: 'warning', text: 'Checkout was cancelled. Your free Pattern Snapshot is still here.' }
          : null,
    };
  }

  const hasSaved = Boolean(saved && Object.keys(saved.answers).length > 0);
  return {
    stage: 'landing',
    answers: hasSaved && saved ? saved.answers : {},
    initialStep: hasSaved && saved ? resumeStep(saved.step, saved.answers) : 0,
    resumeAvailable: hasSaved,
    deepReport: null,
    notice: null,
  };
}

export default function Home() {
  const [initial] = useState(readInitialHomeState);
  const [token] = useState(getToken);
  const [stage, setStage] = useState<Stage>(initial.stage);
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  const [initialStep, setInitialStep] = useState(initial.initialStep);
  const [resumeAvailable, setResumeAvailable] = useState(initial.resumeAvailable);
  const [deepReport, setDeepReport] = useState<DeepReport | null>(initial.deepReport);
  const [unlocked, setUnlocked] = useState(false);
  const [notice, setNotice] = useState<Notice>(initial.notice);
  const [premiumGenerating, setPremiumGenerating] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutHandledRef = useRef(false);
  const analysisStartedRef = useRef(false);

  const generateReport = trpc.report.generate.useMutation();
  const verifyCheckout = trpc.checkout.verify.useMutation();
  const entitlement = trpc.checkout.entitlement.useQuery(
    { token },
    { retry: false, staleTime: 30_000 },
  );

  const beginPremiumAnalysis = useCallback(
    (finalAnswers: Answers) => {
      if (analysisStartedRef.current || deepReport) return;
      analysisStartedRef.current = true;
      setPremiumGenerating(true);
      generateReport.mutate(
        {
          token,
          name: finalAnswers.name ?? '',
          age: getAge(finalAnswers.age_range) ?? undefined,
          single_duration: finalAnswers.single_duration,
          home_climate: finalAnswers.home_climate,
          father_figure: finalAnswers.father_figure,
          child_comfort: finalAnswers.child_comfort,
          breakup_pattern: finalAnswers.breakup_pattern,
          exes_pattern: finalAnswers.exes_pattern,
          he_pulls_away: finalAnswers.he_pulls_away,
          conflict_style: finalAnswers.conflict_style,
          falling_style: finalAnswers.falling_style,
          marriage_timeline: finalAnswers.marriage_timeline,
          children_dream: finalAnswers.children_dream,
          own_words: finalAnswers.own_words,
        },
        {
          onSuccess: (result) => {
            if (result.ok && result.report) {
              const report = result.report as DeepReport;
              setDeepReport(report);
              saveFinished(finalAnswers, report);
              return;
            }
            setNotice({
              tone: 'warning',
              text: 'Your practical tools are unlocked. The optional deeper narrative could not be generated right now, so Revela is showing the reliable built-in version instead.',
            });
          },
          onError: () => {
            setNotice({
              tone: 'warning',
              text: 'Your practical tools are unlocked. The optional deeper narrative is temporarily unavailable, so Revela is showing the reliable built-in version instead.',
            });
          },
          onSettled: () => setPremiumGenerating(false),
        },
      );
    },
    [deepReport, generateReport, token],
  );

  // Restore server-side access on subsequent visits from the same private session.
  useEffect(() => {
    if (!entitlement.data?.paid) return;
    setUnlocked(true);
    if (stage === 'landing') setStage('report');
    if (Object.keys(answers).length === 0 && entitlement.data.answers) {
      setAnswers(entitlement.data.answers);
      setStage('report');
    }
    const restoredAnswers = Object.keys(answers).length === 0 && entitlement.data.answers
      ? entitlement.data.answers
      : answers;
    if (!deepReport && entitlement.data.report) {
      const restoredReport = entitlement.data.report as DeepReport;
      setDeepReport(restoredReport);
      saveFinished(restoredAnswers, restoredReport);
    } else if (Object.keys(answers).length === 0 && entitlement.data.answers) {
      saveFinished(entitlement.data.answers);
    }
  }, [answers, deepReport, entitlement.data, stage]);

  // Verify Stripe on the server. A URL flag alone never unlocks the product.
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId || checkoutHandledRef.current) return;
    checkoutHandledRef.current = true;
    setNotice({ tone: 'warning', text: 'Confirming your payment securely…' });

    verifyCheckout.mutate(
      { token, sessionId },
      {
        onSuccess: (result) => {
          if (!result.paid) {
            setNotice({ tone: 'error', text: 'We could not confirm this payment. No access was granted. Please contact support if you were charged.' });
            return;
          }
          setUnlocked(true);
          setNotice({ tone: 'success', text: 'Payment confirmed. Your complete Secure Love Reset is unlocked.' });
          fbTrackPurchaseOnce(29, 'USD');
          void entitlement.refetch();
        },
        onError: () => {
          setNotice({ tone: 'error', text: 'Payment verification is temporarily unavailable. Please refresh or contact support; your payment remains safe with Stripe.' });
        },
        onSettled: () => {
          const cleanUrl = `${window.location.pathname}${window.location.hash}`;
          window.history.replaceState({}, document.title, cleanUrl || '/');
        },
      },
    );
  }, [entitlement, token, verifyCheckout]);

  useEffect(() => {
    if (!unlocked || Object.keys(answers).length === 0 || deepReport) return;
    beginPremiumAnalysis(answers);
  }, [answers, beginPremiumAnalysis, deepReport, unlocked]);

  const go = (nextStage: Stage) => {
    setStage(nextStage);
    window.scrollTo({ top: 0 });
    ping({ stage: nextStage, identity: { name: answers.name } });
  };

  const startQuiz = () => {
    void loadQuiz();
    fbTrackCustom('QuizStart');
    const saved = loadProgress();
    if (saved) {
      setAnswers(saved.answers);
      setInitialStep(resumeStep(saved.step, saved.answers));
      setResumeAvailable(false);
    }
    go('quiz');
  };

  const startWithName = (name: string) => {
    void loadQuiz();
    fbTrackCustom('QuizStart');
    clearProgress();
    const nextAnswers = { name };
    setAnswers(nextAnswers);
    setInitialStep(1);
    setResumeAvailable(false);
    go('quiz');
  };

  const restartQuiz = () => {
    void loadQuiz();
    clearProgress();
    setAnswers({});
    setInitialStep(0);
    setResumeAvailable(false);
    go('quiz');
  };

  useEffect(() => {
    ping({ stage: initial.stage });
    heartbeatRef.current = setInterval(() => {
      setStage((current) => {
        ping({ stage: current });
        return current;
      });
    }, 60_000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [initial.stage]);

  useEffect(() => {
    if (stage !== 'quiz') return;
    void loadAnalyzing();
    void loadReport();
  }, [stage]);

  const landing = useMemo(
    () => (
      <Landing
        onStart={startQuiz}
        onStartWithName={startWithName}
        resume={resumeAvailable}
        onRestart={restartQuiz}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resumeAvailable],
  );

  if (stage === 'quiz') {
    return (
      <Suspense fallback={<StageFallback />}>
        <Quiz
          answers={answers}
          setAnswers={setAnswers}
          initialStep={initialStep}
          onDone={(finalAnswers) => {
            fbTrack('Lead');
            clearProgress();
            setAnswers(finalAnswers);
            saveFinished(finalAnswers);
            setStage('analyzing');
            window.scrollTo({ top: 0 });
            ping({ stage: 'analyzing', identity: { name: finalAnswers.name } });
          }}
          onHome={() => go('landing')}
        />
      </Suspense>
    );
  }

  if (stage === 'analyzing') {
    return (
      <Suspense fallback={<StageFallback />}>
        <Analyzing name={answers.name ?? ''} onDone={() => go('report')} />
      </Suspense>
    );
  }

  if (stage === 'report') {
    return (
      <Suspense fallback={<StageFallback />}>
        <Report
          answers={answers}
          deep={deepReport}
          unlocked={unlocked}
          premiumGenerating={premiumGenerating}
          notice={notice}
        />
      </Suspense>
    );
  }

  return landing;
}

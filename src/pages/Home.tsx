import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Landing from '../components/Landing';
import { fbTrackCustom, fbTrack, fbTrackPurchaseOnce } from '../lib/fbpixel';
import type { DeepReport } from '../components/Report';
import { ping, loadProgress, clearProgress, saveFinished, loadFinished } from '../lib/tracker';
import { QUESTIONS, getAge, getZodiac, type Answers } from '../lib/engine';
import { trpc } from '@/providers/trpc';

const loadQuiz = () => import('../components/Quiz');
const loadAnalyzing = () => import('../components/Analyzing');
const loadReport = () => import('../components/Report');

const Quiz = lazy(loadQuiz);
const Analyzing = lazy(loadAnalyzing);
const Report = lazy(loadReport);

type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';

function StageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf5ef]" role="status" aria-label="Loading assessment">
      <div className="h-8 w-8 animate-pulse rounded-full bg-[#751545]/20" />
    </div>
  );
}

// clamp a saved step to a valid index
function validStep(step: number, answers: Answers): number {
  const s = Math.max(0, Math.min(step, QUESTIONS.length - 1));
  void answers;
  return s;
}

type InitialHomeState = {
  stage: Stage;
  answers: Answers;
  initialStep: number;
  resumeAvailable: boolean;
  deepReport: DeepReport | null;
  unlocked: boolean;
  needsRegeneration: boolean;
};

function readInitialHomeState(): InitialHomeState {
  const saved = loadProgress();
  const hasSavedProgress = Boolean(saved && Object.keys(saved.answers).length > 0);
  const base: InitialHomeState = {
    stage: 'landing',
    answers: hasSavedProgress && saved ? saved.answers : {},
    initialStep: hasSavedProgress && saved ? validStep(saved.step, saved.answers) : 0,
    resumeAvailable: hasSavedProgress,
    deepReport: null,
    unlocked: false,
    needsRegeneration: false,
  };

  if (new URLSearchParams(window.location.search).get('unlocked') !== '1') return base;

  const finished = loadFinished();
  if (!finished || Object.keys(finished.answers).length === 0) return base;

  return {
    stage: 'report',
    answers: finished.answers,
    initialStep: 0,
    resumeAvailable: false,
    deepReport: finished.deep ? (finished.deep as DeepReport) : null,
    unlocked: true,
    needsRegeneration: !finished.deep,
  };
}

export default function Home() {
  const [initial] = useState(readInitialHomeState);
  const [stage, setStage] = useState<Stage>(initial.stage);
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  const [initialStep, setInitialStep] = useState(initial.initialStep);
  const [resumeAvailable, setResumeAvailable] = useState(initial.resumeAvailable);
  const [deepReport, setDeepReport] = useState<DeepReport | null>(initial.deepReport);
  const [unlocked] = useState(initial.unlocked);
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockHandledRef = useRef(false);

  const generateReport = trpc.report.generate.useMutation();

  // fire Claude generation as soon as the quiz is done; report page waits for it
  const beginAnalysis = useCallback((finalAnswers: Answers) => {
    const z = getZodiac(finalAnswers.zodiac_sign);
    generateReport.mutate(
      {
        name: finalAnswers.name ?? '',
        email: finalAnswers.email,
        age: getAge(finalAnswers.age_range) ?? undefined,
        zodiac: z?.sign,
        single_duration: finalAnswers.single_duration,
        home_climate: finalAnswers.home_climate,
        father_figure: finalAnswers.father_figure,
        mother_love: finalAnswers.mother_love,
        child_comfort: finalAnswers.child_comfort,
        breakup_pattern: finalAnswers.breakup_pattern,
        exes_pattern: finalAnswers.exes_pattern,
        last_lesson: finalAnswers.last_lesson,
        he_pulls_away: finalAnswers.he_pulls_away,
        conflict_style: finalAnswers.conflict_style,
        falling_style: finalAnswers.falling_style,
        marriage_timeline: finalAnswers.marriage_timeline,
        children_dream: finalAnswers.children_dream,
        own_words: finalAnswers.own_words,
      },
      {
        onSuccess: (res) => {
          if (res.ok && res.report) {
            setDeepReport(res.report as DeepReport);
            // keep the exact AI report she was teased with, for the unlock return
            saveFinished(finalAnswers, res.report);
          }
        },
      },
    );
  }, [generateReport]);

  // Handle side effects for a successful Stripe return after state was restored lazily.
  useEffect(() => {
    if (initial.stage !== 'report' || unlockHandledRef.current) return;
    unlockHandledRef.current = true;
    fbTrackPurchaseOnce(9.99, 'USD');
    window.scrollTo({ top: 0 });
    ping({ stage: 'report' });
    if (initial.needsRegeneration) beginAnalysis(initial.answers);
  }, [beginAnalysis, initial]);

  const go = (s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0 });
    ping({
      stage: s,
      identity: { name: answers.name, email: answers.email, phone: answers.phone },
    });
  };

  const startQuiz = () => {
    void loadQuiz();
    fbTrackCustom('QuizStart');
    const saved = loadProgress();
    if (saved) {
      setAnswers(saved.answers);
      setInitialStep(validStep(saved.step, saved.answers));
      setResumeAvailable(false);
    }
    go('quiz');
  };

  const startWithName = (name: string) => {
    void loadQuiz();
    fbTrackCustom('QuizStart');
    clearProgress();
    const a = { name };
    setAnswers(a);
    setInitialStep(1); // name captured on the landing hero — begin at question 2
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

  // first-touch + heartbeat every 20s
  useEffect(() => {
    ping({ stage: initial.stage });
    hbRef.current = setInterval(() => {
      setStage((cur) => {
        ping({ stage: cur });
        return cur;
      });
    }, 20000);
    return () => {
      if (hbRef.current) clearInterval(hbRef.current);
    };
  }, [initial.stage]);

  // Warm the later assessment stages after the visitor has entered the quiz,
  // keeping the landing-page download lean without adding a wait at completion.
  useEffect(() => {
    if (stage !== 'quiz') return;
    void loadAnalyzing();
    void loadReport();
  }, [stage]);

  const landing = useMemo(
    () => (
      <Landing onStart={startQuiz} onStartWithName={startWithName} resume={resumeAvailable} onRestart={restartQuiz} />
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
          onDone={() => {
            fbTrack('Lead');
            clearProgress();
            saveFinished(answers);
            beginAnalysis(answers);
            go('analyzing');
          }}
          onHome={() => go('landing')}
        />
      </Suspense>
    );
  }
  if (stage === 'analyzing') {
    // wait for Claude if it's still writing; the built-in report is instant fallback
    const stillWriting = generateReport.isPending && !generateReport.isError;
    return (
      <Suspense fallback={<StageFallback />}>
        <Analyzing
          name={answers.name ?? ''}
          generating={stillWriting}
          onDone={() => go('report')}
        />
      </Suspense>
    );
  }
  if (stage === 'report') {
    return (
      <Suspense fallback={<StageFallback />}>
        <Report answers={answers} deep={deepReport} unlocked={unlocked} />
      </Suspense>
    );
  }
  return landing;
}

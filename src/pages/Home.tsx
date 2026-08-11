import { useEffect, useMemo, useRef, useState } from 'react';
import Landing from '../components/Landing';
import Quiz from '../components/Quiz';
import Analyzing from '../components/Analyzing';
import Report, { type DeepReport } from '../components/Report';
import { ping, loadProgress, clearProgress } from '../lib/tracker';
import { QUESTIONS, getAge, getZodiac, type Answers } from '../lib/engine';
import { trpc } from '@/providers/trpc';

type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';

// clamp a saved step to a valid index
function validStep(step: number, answers: Answers): number {
  const s = Math.max(0, Math.min(step, QUESTIONS.length - 1));
  void answers;
  return s;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('landing');
  const [answers, setAnswers] = useState<Answers>({});
  const [initialStep, setInitialStep] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [deepReport, setDeepReport] = useState<DeepReport | null>(null);
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateReport = trpc.report.generate.useMutation();

  // fire Claude generation as soon as the quiz is done; report page waits for it
  const beginAnalysis = (finalAnswers: Answers) => {
    const z = getZodiac(finalAnswers.dob);
    generateReport.mutate(
      {
        name: finalAnswers.name ?? '',
        email: finalAnswers.email,
        age: getAge(finalAnswers.dob) ?? undefined,
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
          if (res.ok && res.report) setDeepReport(res.report as DeepReport);
        },
      },
    );
  };

  // restore saved progress on first load
  useEffect(() => {
    const saved = loadProgress();
    if (saved && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      setInitialStep(validStep(saved.step, saved.answers));
      setResumeAvailable(true);
    }
  }, []);

  const go = (s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0 });
    ping({
      stage: s,
      identity: { name: answers.name, email: answers.email, phone: answers.phone },
    });
  };

  const startQuiz = () => {
    const saved = loadProgress();
    if (saved) {
      setAnswers(saved.answers);
      setInitialStep(validStep(saved.step, saved.answers));
      setResumeAvailable(false);
    }
    go('quiz');
  };

  const restartQuiz = () => {
    clearProgress();
    setAnswers({});
    setInitialStep(0);
    setResumeAvailable(false);
    go('quiz');
  };

  // first-touch + heartbeat every 20s
  useEffect(() => {
    ping({ stage: 'landing' });
    hbRef.current = setInterval(() => {
      setStage((cur) => {
        ping({ stage: cur });
        return cur;
      });
    }, 20000);
    return () => {
      if (hbRef.current) clearInterval(hbRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const landing = useMemo(
    () => (
      <Landing onStart={startQuiz} resume={resumeAvailable} onRestart={restartQuiz} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resumeAvailable],
  );

  if (stage === 'quiz') {
    return (
      <Quiz
        answers={answers}
        setAnswers={setAnswers}
        initialStep={initialStep}
        onDone={() => {
          clearProgress();
          beginAnalysis(answers);
          go('analyzing');
        }}
        onHome={() => go('landing')}
      />
    );
  }
  if (stage === 'analyzing') {
    // wait for Claude if it's still writing; the built-in report is instant fallback
    const stillWriting = generateReport.isPending && !generateReport.isError;
    return (
      <Analyzing
        name={answers.name ?? ''}
        generating={stillWriting}
        onDone={() => go('report')}
      />
    );
  }
  if (stage === 'report') {
    return <Report answers={answers} deep={deepReport} />;
  }
  return landing;
}

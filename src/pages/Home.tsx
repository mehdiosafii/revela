import { useEffect, useMemo, useRef, useState } from 'react';
import Landing from '../components/Landing';
import Quiz from '../components/Quiz';
import Analyzing from '../components/Analyzing';
import Report from '../components/Report';
import { ping, loadProgress, clearProgress } from '../lib/tracker';
import { QUESTIONS, type Answers } from '../lib/engine';

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
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          go('analyzing');
        }}
        onHome={() => go('landing')}
      />
    );
  }
  if (stage === 'analyzing') {
    return <Analyzing name={answers.name ?? ''} onDone={() => go('report')} />;
  }
  if (stage === 'report') {
    return <Report answers={answers} />;
  }
  return landing;
}

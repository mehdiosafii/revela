import { useEffect, useRef } from 'react';
import { useState } from 'react';
import Landing from '../components/Landing';
import Quiz from '../components/Quiz';
import Analyzing from '../components/Analyzing';
import Report from '../components/Report';
import { ping } from '../lib/tracker';
import type { Answers } from '../lib/engine';

type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';

export default function Home() {
  const [stage, setStage] = useState<Stage>('landing');
  const [answers, setAnswers] = useState<Answers>({});
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = (s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0 });
    ping({
      stage: s,
      identity: { name: answers.name, email: answers.email, phone: answers.phone },
    });
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

  if (stage === 'quiz') {
    return <Quiz answers={answers} setAnswers={setAnswers} onDone={() => go('analyzing')} />;
  }
  if (stage === 'analyzing') {
    return <Analyzing name={answers.name ?? ''} onDone={() => go('report')} />;
  }
  if (stage === 'report') {
    return <Report answers={answers} />;
  }
  return <Landing onStart={() => go('quiz')} />;
}

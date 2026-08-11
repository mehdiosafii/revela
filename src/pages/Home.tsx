import { useState } from 'react';
import Landing from '../components/Landing';
import Quiz from '../components/Quiz';
import Analyzing from '../components/Analyzing';
import Report from '../components/Report';
import type { Answers } from '../lib/engine';

type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';

export default function Home() {
  const [stage, setStage] = useState<Stage>('landing');
  const [answers, setAnswers] = useState<Answers>({});

  const go = (s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0 });
  };

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

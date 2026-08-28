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
const Quiz = lazy(loadQuiz), Analyzing = lazy(loadAnalyzing), Report = lazy(loadReport);
type Stage = 'landing' | 'quiz' | 'analyzing' | 'report';

function StageFallback() { return <div className="flex min-h-screen items-center justify-center bg-[#fbf5ef]" role="status"><div className="h-8 w-8 animate-pulse rounded-full bg-[#751545]/20" /></div>; }
function validStep(step: number) { return Math.max(0, Math.min(step, QUESTIONS.length - 1)); }

type InitialHomeState = { stage: Stage; answers: Answers; initialStep: number; resumeAvailable: boolean; deepReport: DeepReport | null; unlocked: boolean; needsRegeneration: boolean; };
function readInitialHomeState(): InitialHomeState {
  const saved = loadProgress();
  const hasSaved = Boolean(saved && Object.keys(saved.answers).length > 0);
  const base = { stage: 'landing' as Stage, answers: hasSaved && saved ? saved.answers : {}, initialStep: hasSaved && saved ? validStep(saved.step) : 0, resumeAvailable: hasSaved, deepReport: null, unlocked: false, needsRegeneration: false };
  if (new URLSearchParams(location.search).get('unlocked') !== '1') return base;
  const finished = loadFinished();
  if (!finished || Object.keys(finished.answers).length === 0) return base;
  return { stage: 'report', answers: finished.answers, initialStep: 0, resumeAvailable: false, deepReport: finished.deep as DeepReport | null, unlocked: true, needsRegeneration: !finished.deep };
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

  const beginAnalysis = useCallback((a: Answers) => {
    const z = getZodiac(a.zodiac_sign);
    generateReport.mutate({ name: a.name ?? '', email: a.email, age: getAge(a.age_range) ?? undefined, zodiac: z?.sign, single_duration: a.single_duration, home_climate: a.home_climate, father_figure: a.father_figure, mother_love: a.mother_love, child_comfort: a.child_comfort, breakup_pattern: a.breakup_pattern, exes_pattern: a.exes_pattern, last_lesson: a.last_lesson, he_pulls_away: a.he_pulls_away, conflict_style: a.conflict_style, falling_style: a.falling_style, marriage_timeline: a.marriage_timeline, children_dream: a.children_dream, own_words: a.own_words }, { onSuccess: res => { if (res.ok && res.report) { setDeepReport(res.report as DeepReport); saveFinished(a, res.report); } } });
  }, [generateReport]);

  useEffect(() => {
    if (initial.stage !== 'report' || unlockHandledRef.current) return;
    unlockHandledRef.current = true;
    fbTrackPurchaseOnce(9.99, 'USD');
    scrollTo({ top: 0 }); ping({ stage: 'report' });
    if (initial.needsRegeneration) beginAnalysis(initial.answers);
  }, [beginAnalysis, initial]);

  const go = (s: Stage) => { setStage(s); scrollTo({ top: 0 }); ping({ stage: s, identity: { name: answers.name, email: answers.email, phone: answers.phone } }); };
  const startQuiz = () => { void loadQuiz(); fbTrackCustom('QuizStart'); const saved = loadProgress(); if (saved) { setAnswers(saved.answers); setInitialStep(validStep(saved.step)); setResumeAvailable(false); } go('quiz'); };
  const startWithName = (name: string) => { void loadQuiz(); fbTrackCustom('QuizStart'); clearProgress(); setAnswers({ name }); setInitialStep(1); setResumeAvailable(false); go('quiz'); };
  const restartQuiz = () => { void loadQuiz(); clearProgress(); setAnswers({}); setInitialStep(0); setResumeAvailable(false); go('quiz'); };

  useEffect(() => { ping({ stage: initial.stage }); hbRef.current = setInterval(() => setStage(cur => { ping({ stage: cur }); return cur; }), 20000); return () => { if (hbRef.current) clearInterval(hbRef.current); }; }, [initial.stage]);
  useEffect(() => { if (stage === 'quiz') { void loadAnalyzing(); void loadReport(); } }, [stage]);
  const landing = useMemo(() => <Landing onStart={startQuiz} onStartWithName={startWithName} resume={resumeAvailable} onRestart={restartQuiz} />, [resumeAvailable]);

  if (stage === 'quiz') return <Suspense fallback={<StageFallback />}><Quiz answers={answers} setAnswers={setAnswers} initialStep={initialStep} onDone={() => { fbTrack('Lead'); clearProgress(); saveFinished(answers); go('analyzing'); }} onHome={() => go('landing')} /></Suspense>;
  if (stage === 'analyzing') return <Suspense fallback={<StageFallback />}><Analyzing name={answers.name ?? ''} generating={false} onDone={() => go('report')} /></Suspense>;
  if (stage === 'report') return <Suspense fallback={<StageFallback />}><Report answers={answers} deep={deepReport} unlocked={unlocked} /></Suspense>;
  return landing;
}

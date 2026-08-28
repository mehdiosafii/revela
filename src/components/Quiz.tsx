import { useEffect, useRef, useState } from 'react';
import { ENCOURAGEMENTS, type Answers, type Question } from '../lib/engine';
import { ASSESSMENT_QUESTIONS } from '../lib/assessment';
import { ping, saveProgress, trackAnswer } from '../lib/tracker';

const FREE_CHOICE = '__free__';

interface Props {
  answers: Answers;
  setAnswers: (answers: Answers) => void;
  initialStep: number;
  onDone: (answers: Answers) => void;
  onHome: () => void;
}

function questionInputType(question: Question): 'text' | 'email' | 'date' | 'tel' {
  if (question.type === 'email' || question.type === 'date' || question.type === 'tel') return question.type;
  return 'text';
}

export default function Quiz({ answers, setAnswers, initialStep, onDone, onHome }: Props) {
  const [step, setStep] = useState(initialStep);
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [freeMode, setFreeMode] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [encouragementIndex, setEncouragementIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const question = ASSESSMENT_QUESTIONS[step];
  const total = ASSESSMENT_QUESTIONS.length;
  const progress = Math.round(((step + 1) / total) * 100);
  const isLast = step === total - 1;

  useEffect(() => {
    if (!question) return;
    setValue(answers[question.id] ?? '');
    setSelected(null);
    setFreeMode(false);
    setEncouragementIndex((current) => (current + 1) % ENCOURAGEMENTS.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveProgress(step, answers);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, question?.id]);

  if (!question) return null;

  const advance = (nextAnswers: Answers) => {
    if (isLast) {
      onDone(nextAnswers);
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setStep((current) => Math.min(total - 1, current + 1));
    }, 220);
  };

  const commit = (rawValue: string) => {
    const cleanValue = rawValue.trim();
    if (!cleanValue) return;

    const nextAnswers = { ...answers, [question.id]: cleanValue };
    setAnswers(nextAnswers);
    trackAnswer(question.id, cleanValue);
    const nextStep = Math.min(total, step + 1);
    saveProgress(nextStep, nextAnswers);
    ping({
      stage: 'quiz',
      questionIndex: nextStep,
      questionId: question.id,
      identity: { name: nextAnswers.name },
    });
    advance(nextAnswers);
  };

  const choose = (label: string) => {
    if (selected) return;
    if (label === FREE_CHOICE) {
      setValue('');
      setFreeMode(true);
      window.setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setSelected(label);
    window.setTimeout(() => commit(label), 260);
  };

  const goBack = () => {
    if (step === 0) {
      onHome();
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  };

  const canContinue = value.trim().length > 0;

  return (
    <div className="bg-grain flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 pb-3 pt-4 sm:px-6">
          <button onClick={onHome} className="font-display text-xl font-semibold text-[#3d0b26]" title="Return home — progress is saved">
            Revela
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#751545]/55">
            Question {step + 1} of {total}
          </span>
        </div>
        <div className="h-[3px] bg-[#751545]/10">
          <div
            className="h-full bg-gradient-to-r from-[#751545] via-[#c4688a] to-[#c9a24b] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-36 pt-28 sm:px-6">
        <div key={step} className={`w-full max-w-xl ${leaving ? 'animate-step-out' : 'animate-step-in'}`}>
          {question.chapter && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c9a24b]">{question.chapter}</p>
          )}
          <h1 className="font-display mt-4 text-[1.8rem] font-medium leading-[1.15] tracking-[-0.02em] text-[#3d0b26] sm:text-4xl">
            {question.title}
          </h1>
          {question.subtitle && <p className="mt-4 text-[15px] leading-relaxed text-[#4a1230]/65">{question.subtitle}</p>}

          {question.type === 'qcm' && !freeMode && (
            <div className="mt-9 flex flex-col gap-3">
              {question.options?.map((option, index) => (
                <button
                  key={option.label}
                  onClick={() => choose(option.label)}
                  className={`opt-card group flex items-center gap-4 rounded-2xl px-5 py-4 text-left ${selected === option.label ? 'selected' : ''}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      selected === option.label
                        ? 'border-[#751545] bg-[#751545] text-white'
                        : 'border-[#751545]/30 text-[#751545]/60 group-hover:border-[#751545]'
                    }`}
                  >
                    {selected === option.label ? '✓' : String.fromCharCode(65 + index)}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium text-[#3d0b26]">{option.label}</span>
                    {option.sub && <span className="mt-0.5 block text-[13px] text-[#4a1230]/55">{option.sub}</span>}
                  </span>
                </button>
              ))}
              <button
                onClick={() => choose(FREE_CHOICE)}
                className="mt-1 rounded-2xl border border-dashed border-[#751545]/25 px-5 py-3.5 text-[13.5px] italic text-[#751545]/60 transition hover:border-[#751545]/60 hover:bg-white/60 hover:text-[#751545]"
              >
                ✎ None of these — let me say it myself
              </button>
              <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-[#751545]/35">Tap once to continue</p>
            </div>
          )}

          {question.type === 'qcm' && freeMode && (
            <div className="mt-9">
              <textarea
                ref={(element) => {
                  inputRef.current = element;
                }}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Say it honestly, in your own words…"
                rows={5}
                maxLength={800}
                className="w-full resize-none rounded-2xl border border-[#751545]/20 bg-white/75 p-5 text-[15.5px] leading-relaxed text-[#3d0b26] outline-none focus:border-[#751545]"
              />
              <button onClick={() => setFreeMode(false)} className="mt-3 text-[12.5px] text-[#751545]/55 underline underline-offset-2">
                ← Back to choices
              </button>
            </div>
          )}

          {(question.type === 'text' || question.type === 'email' || question.type === 'date' || question.type === 'tel') && (
            <div className="mt-9">
              <input
                ref={(element) => {
                  inputRef.current = element;
                }}
                type={questionInputType(question)}
                value={value}
                maxLength={question.id === 'name' ? 120 : 400}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canContinue) commit(value);
                }}
                placeholder={question.placeholder}
                className="input-line"
              />
            </div>
          )}

          {question.type === 'textarea' && (
            <div className="mt-9">
              <textarea
                ref={(element) => {
                  inputRef.current = element;
                }}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={question.placeholder}
                rows={6}
                maxLength={2000}
                className="w-full resize-none rounded-2xl border border-[#751545]/20 bg-white/75 p-5 text-[15.5px] leading-relaxed text-[#3d0b26] outline-none focus:border-[#751545]"
              />
              <p className="mt-2 text-right text-[11px] tabular-nums text-[#751545]/35">{value.length}/2000</p>
            </div>
          )}

          {(question.type !== 'qcm' || freeMode) && (
            <button
              onClick={() => commit(value)}
              disabled={!canContinue}
              className={`btn-shine mt-8 w-full rounded-full px-8 py-4 text-[15px] font-semibold text-white transition-opacity ${canContinue ? '' : 'cursor-not-allowed opacity-40'}`}
            >
              <span>{isLast ? 'Show My Free Pattern Snapshot →' : question.motivation || 'Continue →'}</span>
            </button>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <button onClick={goBack} className="text-[12.5px] font-medium text-[#751545]/55 hover:text-[#751545]">
              ← Back
            </button>
            <p className="text-right text-[11.5px] italic text-[#751545]/45">{ENCOURAGEMENTS[encouragementIndex]}</p>
          </div>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-[#751545]/8 bg-[#fbf5ef]/90 px-5 py-3 text-center backdrop-blur-md">
        <p className="text-[10.5px] leading-relaxed text-[#4a1230]/40">
          Private educational self-reflection · not therapy or a diagnosis · your progress is saved in this browser
        </p>
      </footer>
    </div>
  );
}

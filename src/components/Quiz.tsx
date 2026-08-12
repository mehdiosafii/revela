import { useEffect, useRef, useState } from 'react';
import { QUESTIONS, ENCOURAGEMENTS, getZodiac, type Answers, type Question } from '../lib/engine';
import { ping, trackAnswer, saveProgress } from '../lib/tracker';
import { trpc } from '@/providers/trpc';
import { useResetCountdown, SpotNumber } from './Landing';
import SocialProof from './SocialProof';
import ZodiacBadge from './ZodiacBadge';

const FREE_CHOICE = '__free__';

interface Props {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  initialStep: number;
  onDone: () => void;
  onHome: () => void;
}

const REVELATION_LINES: Record<string, string> = {
  'Less than a year':
    'You didn’t say this out loud — but your answers already suggest it: you’re not single, you’re recovering. And there is a difference. Men can feel which one walked into the date.',
  '1 – 3 years':
    'You didn’t say this out loud — but it’s visible already: you’ve built a life so complete that love now has to knock loudly to be let in. Most men knock once.',
  '3 – 5 years':
    'You didn’t say this out loud — but your pattern whispers it: you’ve started confusing peace with loneliness, and protection with standards. Keep going. We’re about to separate the two.',
  'More than 5 years':
    'You didn’t say this out loud — but we hear it anyway: you’ve quietly begun to wonder if it’s you. It isn’t. It’s a pattern. Patterns end. Keep going — this is where.',
  'I’ve never had a serious relationship':
    'You didn’t say this out loud — but your honesty just did something rare: it skipped the shame. That tells us you’re closer to love than women with a decade of wrong relationships. Keep going.',
};

export default function Quiz({ answers, setAnswers, initialStep, onDone, onHome }: Props) {
  const [step, setStep] = useState(initialStep);
  const [leaving, setLeaving] = useState(false);
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [freeMode, setFreeMode] = useState(false);
  const [encIdx, setEncIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const q: Question = QUESTIONS[step];
  const total = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round(((step + 1) / total) * 100);
  const name = answers.name || 'beautiful';

  // real daily scarcity — same live numbers as the landing page
  const spotsQ = trpc.public.spotsLeft.useQuery(undefined, { refetchInterval: 8000, retry: false });
  const spots = spotsQ.data ?? null;
  const resetLabel = useResetCountdown(spots?.resetAt);

  // ── AI revelation after the first 5 real answers (identity excluded) ──
  // Prefetch as soon as all five are in (usually while she reads question 5's
  // result transition), so the insight is already waiting when the step lands.
  const [revelation, setRevelation] = useState<string | null>(null);
  const revelationMutation = trpc.report.revelation.useMutation();
  const revelationStarted = useRef(false);
  const revelationFallback =
    REVELATION_LINES[answers.single_duration ?? ''] ?? REVELATION_LINES['1 – 3 years'];

  useEffect(() => {
    const ready =
      answers.single_duration && answers.home_climate && answers.father_figure &&
      answers.mother_love && answers.child_comfort;
    if (!ready || revelationStarted.current) return;
    revelationStarted.current = true;
    revelationMutation.mutate(
      {
        name: answers.name ?? '',
        single_duration: answers.single_duration,
        home_climate: answers.home_climate,
        father_figure: answers.father_figure,
        mother_love: answers.mother_love,
        child_comfort: answers.child_comfort,
      },
      {
        onSuccess: (res) => setRevelation((cur) => cur ?? (res.ok && res.text ? res.text : revelationFallback)),
        onError: () => setRevelation((cur) => cur ?? revelationFallback),
      },
    );
    // never leave her stuck on the insight screen
    const timeout = setTimeout(() => setRevelation((cur) => cur ?? revelationFallback), 30000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, step]);

  useEffect(() => {
    setValue(answers[q.id] ?? '');
    setSelected(null);
    setFreeMode(false);
    setEncIdx((e) => (e + 1) % ENCOURAGEMENTS.length);
    window.scrollTo({ top: 0 });
    saveProgress(step, answers);
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const commit = (val: string, advance = true) => {
    const nextAnswers = { ...answers, [q.id]: val };
    setAnswers(nextAnswers);
    if (val) trackAnswer(q.id, val);
    const nextStep = advance ? step + 1 : step;
    ping({
      stage: 'quiz',
      questionIndex: nextStep,
      questionId: q.id,
      identity: { name: nextAnswers.name, email: nextAnswers.email, phone: nextAnswers.phone },
    });
    saveProgress(nextStep, nextAnswers);
    if (!advance) return;
    if (step === total - 1) {
      onDone();
      return;
    }
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      setStep((s) => s + 1);
    }, 300);
  };

  const pickOption = (label: string) => {
    if (selected) return;
    if (label === FREE_CHOICE) {
      setFreeMode(true);
      setTimeout(() => inputRef.current?.focus(), 80);
      return;
    }
    setSelected(label);
    setTimeout(() => commit(label), 480); // auto-advance, no Next needed
  };

  const canContinue = () => {
    if (q.type === 'tel') return true; // optional
    if (q.type === 'photo') return true; // skippable
    if (q.type === 'revelation') return revelation !== null; // wait for the AI insight
    return value.trim().length > 0;
  };


  return (
    <div className="bg-grain flex min-h-screen flex-col">
      {/* progress header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fbf5ef]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-4 pb-3">
          <button
            onClick={onHome}
            title="Back to home — your progress is saved"
            className="font-display text-xl font-semibold tracking-tight text-[#3d0b26] transition-opacity hover:opacity-60"
          >
            Revela
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#751545]/60">
            {step + 1} / {total}
          </span>
        </div>
        <div className="h-[3px] w-full bg-[#751545]/10">
          <div
            className="h-full bg-gradient-to-r from-[#751545] via-[#c4688a] to-[#c9a24b] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {spots && spots.left > 0 && (
          <div className="bg-[#3d0b26] px-4 py-1.5 text-center">
            <p className="text-[11px] font-medium tracking-wide text-[#fbf5ef]/90">
              Only <SpotNumber value={spots.left} /> <span className="font-semibold text-[#edc840]">spots left today</span>
              {resetLabel && (
                <span className="text-[#fbf5ef]/70">
                  {' '}· new spots in <span className="font-semibold tabular-nums text-[#edc840]">{resetLabel}</span>
                </span>
              )}
            </p>
          </div>
        )}
      </header>

      {/* question body */}
      <main className="flex flex-1 items-center justify-center px-6 pb-40 pt-28">
        <div
          key={step}
          className={`w-full max-w-xl ${leaving ? 'animate-step-out' : 'animate-step-in'}`}
        >
          {/* ── AI revelation interstitial (after the first 5 real answers) ── */}
          {q.type === 'revelation' && (
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">
                First insight · unlocked
              </p>
              <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a24b] to-transparent" />
              {revelation ? (
                <p className="font-display animate-rise-in mx-auto mt-8 max-w-lg text-[1.35rem] font-light italic leading-relaxed text-[#3d0b26] md:text-[1.6rem]">
                  “{revelation}”
                </p>
              ) : (
                <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3">
                  <p className="text-[12px] uppercase tracking-[0.25em] text-[#751545]/50">
                    Reading your first five answers…
                  </p>
                  <div className="h-5 w-4/5 animate-pulse rounded-full bg-[#751545]/10" />
                  <div className="h-5 w-full animate-pulse rounded-full bg-[#751545]/10" style={{ animationDelay: '0.15s' }} />
                  <div className="h-5 w-3/5 animate-pulse rounded-full bg-[#751545]/10" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
              <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a24b] to-transparent" />
              <p className="mt-6 text-[12.5px] text-[#751545]/55">
                That was only five answers. Imagine what the full report sees.
              </p>
            </div>
          )}

          {/* ── Regular question ── */}
          {q.type !== 'revelation' && (
            <>
              {q.chapter && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a24b]">{q.chapter}</p>
              )}
              <h2 className="font-display mt-4 text-[1.7rem] font-medium leading-snug tracking-[-0.01em] text-[#3d0b26] md:text-4xl">
                {q.title}
              </h2>
              {q.subtitle && (
                <p className="mt-3 text-[15px] leading-relaxed text-[#4a1230]/65">{q.subtitle}</p>
              )}

              {/* QCM — click = auto advance */}
              {q.type === 'qcm' && !freeMode && (
                <div className="mt-9 flex flex-col gap-3">
                  {q.options!.map((o, i) => (
                    <button
                      key={o.label}
                      onClick={() => pickOption(o.label)}
                      className={`opt-card group flex items-center gap-4 rounded-2xl px-5 py-4 text-left ${
                        selected === o.label ? 'selected' : ''
                      }`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                          selected === o.label
                            ? 'border-[#751545] bg-[#751545] text-white'
                            : 'border-[#751545]/30 text-[#751545]/60 group-hover:border-[#751545]'
                        }`}
                      >
                        {selected === o.label ? '✓' : String.fromCharCode(65 + i)}
                      </span>
                      <span>
                        <span className="block text-[15px] font-medium text-[#3d0b26]">{o.label}</span>
                        {o.sub && <span className="mt-0.5 block text-[13px] text-[#4a1230]/55">{o.sub}</span>}
                      </span>
                    </button>
                  ))}
                  {/* free expression */}
                  <button
                    onClick={() => pickOption(FREE_CHOICE)}
                    className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#751545]/25 px-5 py-3.5 text-[13.5px] italic text-[#751545]/60 transition-all hover:border-[#751545]/60 hover:bg-white/60 hover:text-[#751545]"
                  >
                    <span className="text-[15px] not-italic">✎</span> None of these — I’d rather say it myself…
                  </button>
                  <p className="mt-3 text-center text-[11.5px] uppercase tracking-widest text-[#751545]/40">
                    tap once — we’ll move you forward
                  </p>
                </div>
              )}

              {/* free-expression mode for QCM */}
              {q.type === 'qcm' && freeMode && (
                <div className="animate-step-in mt-9">
                  <textarea
                    ref={(el) => {
                      inputRef.current = el;
                    }}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Say it in your own words — honestly, freely…"
                    rows={4}
                    className="w-full resize-none rounded-2xl border-[1.5px] border-[#751545]/20 bg-white/70 p-5 text-[15.5px] leading-relaxed text-[#3d0b26] outline-none backdrop-blur-sm transition-colors placeholder:text-[#751545]/30 focus:border-[#751545]"
                  />
                  <button
                    onClick={() => setFreeMode(false)}
                    className="mt-2 text-[12.5px] text-[#751545]/50 underline underline-offset-2"
                  >
                    ← back to the choices
                  </button>
                </div>
              )}

              {/* text / email / date / tel */}
              {(q.type === 'text' || q.type === 'email' || q.type === 'date' || q.type === 'tel') && (
                <div className="mt-9">
                  <input
                    ref={(el) => {
                      inputRef.current = el;
                    }}
                    type={q.type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canContinue()) commit(value);
                    }}
                    placeholder={q.placeholder}
                    className="input-line"
                  />
                  {/* live zodiac reveal under the birth-date field */}
                  {q.type === 'date' && value && getZodiac(value) && (
                    <ZodiacBadge zodiac={getZodiac(value)!} name={answers.name} />
                  )}
                  {/* consent note — required for ads & payment compliance */}
                  {q.type === 'email' && (
                    <p className="mt-3 max-w-md text-[11.5px] leading-relaxed text-[#751545]/45">
                      By continuing you agree to our{' '}
                      <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a> and{' '}
                      <a href="/terms" className="underline underline-offset-2">Terms</a>. We email your report
                      and occasional guidance — unsubscribe anytime. Never sold, never shared.
                    </p>
                  )}
                </div>
              )}

              {/* textarea */}
              {q.type === 'textarea' && (
                <div className="mt-9">
                  <textarea
                    ref={(el) => {
                      inputRef.current = el;
                    }}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={q.placeholder}
                    rows={4}
                    className="w-full resize-none rounded-2xl border-[1.5px] border-[#751545]/20 bg-white/70 p-5 text-[15.5px] leading-relaxed text-[#3d0b26] outline-none backdrop-blur-sm transition-colors placeholder:text-[#751545]/30 focus:border-[#751545]"
                  />
                  <p className="mt-2 text-right text-[11.5px] text-[#751545]/40">
                    {value.trim().split(/\s+/).filter(Boolean).length} words — take your time
                  </p>
                </div>
              )}

              {/* photo */}
              {q.type === 'photo' && (
                <div className="mt-9">
                  <label className="group flex cursor-pointer flex-col items-center gap-5 rounded-3xl border-2 border-dashed border-[#751545]/25 bg-white/60 p-10 text-center transition-colors hover:border-[#751545]/60">
                    {value ? (
                      <>
                        <img
                          src={value}
                          alt="you"
                          className="h-32 w-32 rounded-full border-4 border-[#c9a24b]/50 object-cover shadow-lg"
                        />
                        <p className="font-display text-xl text-[#3d0b26]">
                          You look beautiful, {name}. <span className="text-[#751545]">Truly.</span>
                        </p>
                        <p className="text-[12px] text-[#751545]/50">Tap to change</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#751545]/10 to-[#c4688a]/15 text-3xl text-[#751545]/60 transition-transform group-hover:scale-110">
                          ✦
                        </div>
                        <p className="text-[15px] font-medium text-[#3d0b26]">Tap to upload your photo</p>
                        <p className="text-[12px] text-[#751545]/50">JPG or PNG · encrypted · never published</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => setValue(String(reader.result));
                        reader.readAsDataURL(f);
                      }}
                    />
                  </label>
                </div>
              )}
            </>
          )}

          {/* ── Next button (hidden for standard qcm, shown in free mode) ── */}
          {(q.type !== 'qcm' || freeMode) && (
            <div className="mt-10 flex flex-col items-start gap-3">
              <button
                onClick={() => canContinue() && commit(value)}
                disabled={!canContinue()}
                className={`btn-shine flex items-center gap-3 rounded-full px-8 py-4 text-[15px] font-semibold text-white ${
                  !canContinue() ? 'cursor-not-allowed opacity-40' : ''
                }`}
              >
                <span>{q.motivation}</span>
              </button>
              {q.type === 'tel' && !value && (
                <button onClick={() => commit('')} className="text-[12.5px] text-[#751545]/50 underline underline-offset-2">
                  skip for now
                </button>
              )}
              {q.type === 'photo' && !value && (
                <button onClick={() => commit('')} className="text-[12.5px] text-[#751545]/50 underline underline-offset-2">
                  I’d rather not — continue
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* encouragement strip — progress-aware */}
      <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden md:block">
        <p key={encIdx} className="animate-rise-in font-display max-w-[240px] text-[15px] italic leading-snug text-[#751545]/55">
          {progress >= 80
            ? '“Nearly there — your report is taking shape.”'
            : progress >= 50
              ? '“Past the halfway point. This honesty is rare.”'
              : `“${ENCOURAGEMENTS[encIdx]}”`}
        </p>
      </div>

      {/* social proof toasts */}
      <SocialProof active />

      {/* answered counter, subtle */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden text-[11px] font-medium uppercase tracking-widest text-[#751545]/35 lg:block">
        {answeredCount} truths given
      </div>
    </div>
  );
}

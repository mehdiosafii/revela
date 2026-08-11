import { useEffect, useRef, useState } from 'react';
import { QUESTIONS, ENCOURAGEMENTS, getZodiac, type Answers, type Question } from '../lib/engine';
import SocialProof from './SocialProof';

interface Props {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onDone: () => void;
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

export default function Quiz({ answers, setAnswers, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [encIdx, setEncIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const q: Question = QUESTIONS[step];
  const total = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round(((step + 1) / total) * 100);
  const name = answers.name || 'beautiful';

  useEffect(() => {
    setValue(answers[q.id] ?? '');
    setSelected(null);
    setEncIdx((e) => (e + 1) % ENCOURAGEMENTS.length);
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const commit = (val: string, advance = true) => {
    setAnswers({ ...answers, [q.id]: val });
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
    setSelected(label);
    setTimeout(() => commit(label), 480); // auto-advance, no Next needed
  };

  const canContinue = () => {
    if (q.type === 'tel') return true; // optional
    if (q.type === 'photo') return true; // skippable
    if (q.type === 'zodiac' || q.type === 'revelation') return true;
    return value.trim().length > 0;
  };

  const zodiac = getZodiac(answers.dob);

  return (
    <div className="bg-grain flex min-h-screen flex-col">
      {/* progress header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fbf5ef]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-4 pb-3">
          <span className="font-display text-xl font-semibold tracking-tight text-[#3d0b26]">Revela</span>
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
      </header>

      {/* question body */}
      <main className="flex flex-1 items-center justify-center px-6 pb-40 pt-28">
        <div
          key={step}
          className={`w-full max-w-xl ${leaving ? 'animate-step-out' : 'animate-step-in'}`}
        >
          {/* ── Zodiac interstitial ── */}
          {q.type === 'zodiac' && (
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">A small discovery</p>
              <div className="animate-pulse-soft font-display mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#751545] to-[#c4688a] text-6xl text-white shadow-[0_20px_50px_-12px_rgba(117,21,69,0.5)]">
                {zodiac?.symbol ?? '✦'}
              </div>
              <h2 className="font-display mt-8 text-3xl font-medium leading-snug text-[#3d0b26] md:text-4xl">
                {name}, you’re a <em className="text-[#751545]">{zodiac?.sign ?? 'mystery'}</em>.
              </h2>
              {zodiac && (
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#4a1230]/75">
                  A {zodiac.element} sign — which means {zodiac.trait}.
                </p>
              )}
              <p className="mt-5 text-[12px] italic text-[#751545]/50">
                (We don’t use astrology in your analysis. But admit it — that landed.)
              </p>
            </div>
          )}

          {/* ── Revelation interstitial (after the first 5 questions) ── */}
          {q.type === 'revelation' && (
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">
                First insight · unlocked
              </p>
              <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a24b] to-transparent" />
              <p className="font-display mx-auto mt-8 max-w-lg text-2xl font-light italic leading-relaxed text-[#3d0b26] md:text-[1.75rem]">
                “{REVELATION_LINES[answers.single_duration] ?? REVELATION_LINES['1 – 3 years']}”
              </p>
              <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a24b] to-transparent" />
              <p className="mt-6 text-[12.5px] text-[#751545]/55">
                That was only question five. Imagine what the full report sees.
              </p>
            </div>
          )}

          {/* ── Regular question ── */}
          {q.type !== 'zodiac' && q.type !== 'revelation' && (
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
              {q.type === 'qcm' && (
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
                  <p className="mt-3 text-center text-[11.5px] uppercase tracking-widest text-[#751545]/40">
                    tap once — we’ll move you forward
                  </p>
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

          {/* ── Next button (hidden for qcm) ── */}
          {q.type !== 'qcm' && (
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

      {/* encouragement strip */}
      <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden md:block">
        <p key={encIdx} className="animate-rise-in font-display max-w-[220px] text-[15px] italic leading-snug text-[#751545]/55">
          “{ENCOURAGEMENTS[encIdx]}”
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

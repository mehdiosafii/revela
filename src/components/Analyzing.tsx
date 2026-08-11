import { useEffect, useRef, useState } from 'react';

interface Props {
  name: string;
  onDone: () => void;
  generating?: boolean; // true while Claude is still writing
}

const DURATION = 22000; // base animation ~22s; if generating, we hold at the final phase

const CHAPTERS = [
  'Your childhood home',
  'The father template',
  'The mother’s lesson',
  'The loves behind you',
  'How you love today',
  'The life you want',
];

const PHASES = [
  'Gathering your answers…',
  'Reading the little girl in you…',
  'Tracing the father template…',
  'Following the thread through your exes…',
  'Finding the pattern between the lines…',
  'Writing your revelation…',
];

/* a golden particle flying from the edge into the center orb */
function Particle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  return (
    <span
      className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#edc840]"
      style={{
        boxShadow: '0 0 10px rgba(237,200,64,0.9)',
        animation: `fly-in 2.4s cubic-bezier(0.5, 0, 0.8, 0.4) ${delay}s infinite`,
        ['--angle' as string]: `${angle}deg`,
        ['--dist' as string]: `${distance}px`,
      }}
    />
  );
}

export default function Analyzing({ name, onDone, generating = false }: Props) {
  const [pct, setPct] = useState(0);
  const [chapterIdx, setChapterIdx] = useState(-1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [finalGlow, setFinalGlow] = useState(false);
  const doneRef = useRef(false);
  const startRef = useRef(Date.now());

  // progress driver — eased, never quite hits 100 until generation is done
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      let eased = 1 - Math.pow(1 - t, 2.4);
      if (generating && t >= 1) eased = 0.97; // hold at 97% while Claude writes
      setPct(Math.round(eased * 100));
      setPhaseIdx(Math.min(Math.floor(eased * PHASES.length), PHASES.length - 1));
      setChapterIdx(Math.min(Math.floor(eased * CHAPTERS.length), CHAPTERS.length - 1));
      if (t >= 1 && !generating && !doneRef.current) {
        doneRef.current = true;
        setFinalGlow(true);
        setTimeout(onDone, 1400);
      }
    }, 60);
    return () => clearInterval(iv);
  }, [generating, onDone]);

  // if generation finished after animation completed
  useEffect(() => {
    if (!generating && Date.now() - startRef.current >= DURATION && !doneRef.current) {
      doneRef.current = true;
      setFinalGlow(true);
      setTimeout(onDone, 1400);
    }
  }, [generating, onDone]);

  const particles = Array.from({ length: 14 }, (_, i) => ({
    delay: (i * 0.33) % 2.4,
    angle: (i * 137.5) % 360,
    distance: 150 + (i % 4) * 28,
  }));

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#2a0718] px-6 text-center text-[#fbf5ef] transition-all duration-1000 ${
        finalGlow ? 'bg-[#3d0b26]' : ''
      }`}
    >
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(196,104,138,0.28) 0%, rgba(117,21,69,0.14) 45%, transparent 70%)',
          opacity: finalGlow ? 1 : 0.6,
        }}
      />

      {/* orb + particles */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* breathing rings */}
        <div className="animate-pulse-soft absolute inset-0 rounded-full border border-[#c9a24b]/25" />
        <div className="animate-pulse-soft absolute inset-6 rounded-full border border-[#c4688a]/30" style={{ animationDelay: '-0.8s' }} />
        <div className="animate-pulse-soft absolute inset-12 rounded-full border border-[#edc840]/20" style={{ animationDelay: '-1.6s' }} />

        {/* the orb */}
        <div
          className="relative flex h-36 w-36 items-center justify-center rounded-full transition-all duration-1000"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #c4688a 0%, #751545 55%, #3d0b26 100%)',
            boxShadow: finalGlow
              ? '0 0 120px rgba(237,200,64,0.5), 0 0 60px rgba(196,104,138,0.6), inset 0 0 40px rgba(237,200,64,0.25)'
              : '0 0 60px rgba(196,104,138,0.45), inset 0 0 30px rgba(237,200,64,0.12)',
            transform: finalGlow ? 'scale(1.12)' : 'scale(1)',
          }}
        >
          <span className="font-display text-4xl font-light tabular-nums text-[#fbf5ef]">{pct}%</span>
        </div>
      </div>

      {/* phase line */}
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">
        {name ? `${name}, ` : ''}Revela is reading you
      </p>
      <p key={phaseIdx} className="animate-rise-in font-display mt-4 max-w-md text-xl font-light italic text-[#fbf5ef]/90 md:text-2xl">
        {PHASES[phaseIdx]}
      </p>

      {/* chapter checklist */}
      <div className="mt-10 flex flex-col items-center gap-2.5">
        {CHAPTERS.map((c, i) => {
          const done = i < chapterIdx;
          const active = i === chapterIdx;
          return (
            <div
              key={c}
              className={`flex items-center gap-3 text-[14px] transition-all duration-500 ${
                done ? 'text-[#edc840]' : active ? 'text-[#fbf5ef]' : 'text-[#fbf5ef]/30'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-all duration-500 ${
                  done
                    ? 'border-[#edc840] bg-[#edc840] text-[#3d0b26]'
                    : active
                      ? 'border-[#c4688a] text-[#c4688a]'
                      : 'border-[#fbf5ef]/25'
                }`}
              >
                {done ? '✓' : active ? '●' : ''}
              </span>
              <span className={done ? 'line-through opacity-70' : ''}>{c}</span>
              {active && <span className="animate-pulse-soft text-[#c4688a]">…</span>}
            </div>
          );
        })}
      </div>

      {/* final glow message */}
      {finalGlow && (
        <p className="animate-rise-in font-display absolute bottom-24 text-lg italic text-[#edc840]">
          Your revelation is ready.
        </p>
      )}

      <p className="absolute bottom-8 max-w-sm text-[11px] leading-relaxed text-[#fbf5ef]/35">
        Your answers are encrypted and analyzed privately. Nothing is shared. Nothing is stored without your consent.
      </p>
    </div>
  );
}

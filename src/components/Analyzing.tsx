import { useEffect, useState } from 'react';

interface Props {
  name: string;
  onDone: () => void;
}

const DURATION = 20000; // 20s

const PHASES = [
  'Reading your story…',
  'Mapping your attachment imprint…',
  'Tracing the father-figure template…',
  'Decoding your relationship reflexes…',
  'Cross-referencing 38,412 female profiles…',
  'Composing your personal revelation…',
];

export default function Analyzing({ name, onDone }: Props) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      // ease-out curve so it feels alive, lands exactly at 100
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 2.2);
      setPct(Math.round(eased * 100));
      if (elapsed >= DURATION) {
        clearInterval(iv);
        setTimeout(onDone, 600);
      }
    }, 60);
    return () => clearInterval(iv);
  }, [onDone]);

  const phase = PHASES[Math.min(Math.floor((pct / 100) * PHASES.length), PHASES.length - 1)];
  const R = 84;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#3d0b26] px-6 text-center text-[#fbf5ef]">
      {/* animated rings */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* outer dashed ring */}
        <svg className="animate-ring-rotate absolute inset-0 h-full w-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(237,200,64,0.25)" strokeWidth="1" strokeDasharray="3 7" />
        </svg>
        {/* reverse ring */}
        <svg className="animate-ring-rotate-rev absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(196,104,138,0.3)" strokeWidth="1" strokeDasharray="14 10" />
        </svg>
        {/* orbiting dot */}
        <div className="animate-orb absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-[#edc840] shadow-[0_0_16px_rgba(237,200,64,0.9)]" />
        {/* progress circle */}
        <svg className="absolute inset-6 h-[calc(100%-48px)] w-[calc(100%-48px)] -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(251,245,239,0.12)" strokeWidth="4" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="url(#grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * pct) / 100}
            style={{ transition: 'stroke-dashoffset 0.12s linear' }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4688a" />
              <stop offset="100%" stopColor="#edc840" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative">
          <p className="font-display text-5xl font-light tabular-nums">{pct}%</p>
        </div>
      </div>

      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">
        Revela is working for you{name ? `, ${name}` : ''}
      </p>
      <p key={phase} className="animate-rise-in font-display mt-4 max-w-md text-xl font-light italic text-[#fbf5ef]/85 md:text-2xl">
        {phase}
      </p>

      {/* phase dots */}
      <div className="mt-8 flex gap-2">
        {PHASES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= Math.floor((pct / 100) * PHASES.length) - 1 || pct === 100
                ? 'w-6 bg-[#edc840]'
                : 'w-1.5 bg-[#fbf5ef]/25'
            }`}
          />
        ))}
      </div>

      <p className="mt-12 max-w-sm text-[12px] leading-relaxed text-[#fbf5ef]/45">
        Your answers are encrypted and analyzed privately. Nothing is shared. Nothing is stored without your consent.
      </p>
    </div>
  );
}

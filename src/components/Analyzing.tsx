import { useEffect, useRef, useState } from 'react';

interface Props {
  name: string;
  onDone: () => void;
}

const DURATION_MS = 4800;
const PHASES = [
  'Organizing your answers…',
  'Comparing the reactions that repeat…',
  'Building your Pattern Snapshot…',
  'Preparing one practical next move…',
];

export default function Analyzing({ name, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const next = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
      setProgress(next);
      if (next >= 100 && !completedRef.current) {
        completedRef.current = true;
        window.clearInterval(interval);
        window.setTimeout(onDone, 450);
      }
    }, 60);
    return () => window.clearInterval(interval);
  }, [onDone]);

  const phase = PHASES[Math.min(PHASES.length - 1, Math.floor((progress / 100) * PHASES.length))];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#2a0718] px-6 text-center text-[#fbf5ef]">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,104,138,.28), rgba(117,21,69,.12) 45%, transparent 70%)' }}
      />

      <div className="relative flex h-64 w-64 items-center justify-center">
        <div className="animate-pulse-soft absolute inset-0 rounded-full border border-[#c9a24b]/20" />
        <div className="animate-pulse-soft absolute inset-7 rounded-full border border-[#c4688a]/30" style={{ animationDelay: '-.8s' }} />
        <div
          className="relative flex h-36 w-36 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #c4688a 0%, #751545 55%, #3d0b26 100%)',
            boxShadow: '0 0 70px rgba(196,104,138,.42), inset 0 0 30px rgba(237,200,64,.12)',
          }}
        >
          <span className="font-display text-4xl font-light tabular-nums">{progress}%</span>
        </div>
      </div>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#edc840]">
        {name ? `${name}, your snapshot is taking shape` : 'Your snapshot is taking shape'}
      </p>
      <p key={phase} className="animate-rise-in font-display mt-4 max-w-md text-xl font-light italic text-[#fbf5ef]/90 md:text-2xl">
        {phase}
      </p>
      <p className="mt-9 max-w-sm text-[12px] leading-relaxed text-[#fbf5ef]/45">
        This screen organizes your assessment responses into an educational reflection. It is not a diagnosis or a prediction.
      </p>
    </div>
  );
}

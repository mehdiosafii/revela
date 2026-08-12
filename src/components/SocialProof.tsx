import { useEffect, useState } from 'react';
import { REVIEWS, type Review } from '../lib/engine';

function Stars() {
  return (
    <div className="flex gap-[2px] text-[13px] star-gold" aria-label="5 stars">
      {'★★★★★'.split('').map((s, i) => (
        <span key={i}>{s}</span>
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .replace('.', '')
    .slice(0, 2)
    .toUpperCase();
}

export default function SocialProof({ active }: { active: boolean }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!active) return;
    let showT: ReturnType<typeof setTimeout>;
    let hideT: ReturnType<typeof setTimeout>;
    let goneT: ReturnType<typeof setTimeout>;

    const cycle = (i: number) => {
      setIdx(i % REVIEWS.length);
      setLeaving(false);
      setVisible(true);
      hideT = setTimeout(() => setLeaving(true), 5200);
      goneT = setTimeout(() => {
        setVisible(false);
        showT = setTimeout(() => cycle(i + 1), 9000 + Math.random() * 7000);
      }, 5700);
    };

    showT = setTimeout(() => cycle(0), 4500);
    return () => {
      clearTimeout(showT);
      clearTimeout(hideT);
      clearTimeout(goneT);
    };
  }, [active]);

  if (!visible) return null;
  const r: Review = REVIEWS[idx];

  return (
    <div
      className={`pointer-events-none fixed bottom-5 right-5 z-[90] w-[330px] max-w-[calc(100vw-2.5rem)] ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      role="status"
    >
      <div className="relative rounded-2xl border border-[#751545]/15 bg-white/95 p-4 shadow-[0_18px_50px_-12px_rgba(61,11,38,0.35)] backdrop-blur-md">
        <button
          aria-label="Dismiss"
          onClick={() => setLeaving(true)}
          className="pointer-events-auto absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#751545]/15 bg-white text-[11px] text-[#751545]/60 shadow-sm transition-colors hover:text-[#751545]"
        >
          ✕
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#751545] to-[#c4688a] text-sm font-semibold text-white">
            {initials(r.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[13px] font-semibold text-[#3d0b26]">
                {r.name} <span className="font-normal text-[#751545]/50">· {r.place}</span>
              </p>
              
            </div>
            <Stars />
            <p className="mt-1.5 text-[12.5px] leading-snug text-[#4a1230]/85">{r.text}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#751545]/10 pt-2">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-[#751545]/60">
            <path d="M10 1.7 12.6 7l5.7.6-4.3 3.9 1.2 5.6L10 14.2l-5.2 2.9 1.2-5.6L1.7 7.6 7.4 7 10 1.7Z" />
          </svg>
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#751545]/55">
            Verified Revela member
          </span>
        </div>
      </div>
    </div>
  );
}

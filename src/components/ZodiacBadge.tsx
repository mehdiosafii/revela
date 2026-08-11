import type { Zodiac } from '../lib/engine';

/**
 * Small animated reveal that appears right under the date-of-birth field:
 * a night-sky card where the constellation stars pop in one by one,
 * the lines draw themselves, and the glyph springs into place.
 */
export default function ZodiacBadge({ zodiac, name }: { zodiac: Zodiac; name?: string }) {
  return (
    <div key={zodiac.sign} className="animate-zodiac-rise mt-6">
      <div className="gold-ring relative overflow-hidden rounded-2xl border border-[#c9a24b]/30 bg-gradient-to-br from-[#3d0b26] via-[#4a1230] to-[#2a0718] p-5">
        {/* twinkling background stars */}
        <span className="animate-twinkle absolute left-[12%] top-[18%] text-[8px] text-[#edc840]/60">✦</span>
        <span className="animate-twinkle absolute right-[14%] top-[28%] text-[6px] text-[#edc840]/50" style={{ animationDelay: '-0.8s' }}>✦</span>
        <span className="animate-twinkle absolute bottom-[20%] left-[22%] text-[7px] text-[#e9babb]/50" style={{ animationDelay: '-1.5s' }}>✦</span>
        <span className="animate-twinkle absolute bottom-[26%] right-[26%] text-[5px] text-[#edc840]/40" style={{ animationDelay: '-0.4s' }}>✦</span>

        <div className="flex items-center gap-5">
          {/* constellation canvas */}
          <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0" aria-hidden>
            {zodiac.lines.map(([a, b], i) => (
              <line
                key={i}
                x1={zodiac.stars[a][0]}
                y1={zodiac.stars[a][1]}
                x2={zodiac.stars[b][0]}
                y2={zodiac.stars[b][1]}
                stroke="#c9a24b"
                strokeOpacity="0.55"
                strokeWidth="1"
                strokeDasharray="140"
                strokeDashoffset="140"
                className="animate-line-draw"
                style={{ animationDelay: `${350 + i * 130}ms` }}
              />
            ))}
            {zodiac.stars.map(([x, y], i) => (
              <g key={i} className="animate-star-pop" style={{ animationDelay: `${150 + i * 130}ms`, transformOrigin: `${x}px ${y}px` }}>
                <circle cx={x} cy={y} r="4.5" fill="#edc840" opacity="0.18" />
                <circle cx={x} cy={y} r="1.8" fill="#edc840" />
              </g>
            ))}
          </svg>

          {/* sign + trait */}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2.5">
              <span
                className="animate-glyph-pop font-display text-3xl text-[#edc840]"
                style={{ animationDelay: '500ms', textShadow: '0 0 14px rgba(237,200,64,0.6)' }}
              >
                {zodiac.symbol}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#edc840]/80">
                  Written in the stars
                </p>
                <p className="font-display text-xl font-medium text-[#fbf5ef]">
                  {name ? `${name}, you’re a ` : 'You’re a '}
                  <em className="text-[#edc840]">{zodiac.sign}</em>
                </p>
              </div>
            </div>
            <p className="animate-zodiac-rise mt-2 text-[12.5px] leading-snug text-[#fbf5ef]/70" style={{ animationDelay: '700ms' }}>
              A {zodiac.element} sign — {zodiac.trait}.
            </p>
            <p className="animate-zodiac-rise mt-1.5 text-[10.5px] italic text-[#fbf5ef]/40" style={{ animationDelay: '850ms' }}>
              (just for fun — your report runs on science, not stars)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

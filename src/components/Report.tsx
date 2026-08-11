import { useEffect, useRef, useState } from 'react';
import { buildReport, type Answers } from '../lib/engine';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setSeen(true), obs.disconnect()),
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, seen };
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, seen } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">{kicker}</p>
      <h2 className="font-display mt-4 text-3xl font-medium leading-tight text-[#3d0b26] md:text-4xl">{children}</h2>
    </div>
  );
}

export default function Report({ answers }: { answers: Answers }) {
  const r = buildReport(answers);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-grain min-h-screen">
      {/* ── Report header ── */}
      <header className="border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tracking-tight text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a24b]">Personal Report</span>
          </div>
          <span className="text-[11px] uppercase tracking-widest text-[#751545]/50">{today}</span>
        </div>
      </header>

      {/* ── Cover ── */}
      <section className="px-6 pb-24 pt-20 text-center">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">
            Prepared exclusively for
          </p>
          <h1 className="font-display mt-5 text-4xl font-medium tracking-tight text-[#3d0b26] md:text-6xl">
            {r.name}
            {r.zodiac && <span className="ml-3 text-3xl text-[#c9a24b] md:text-4xl">{r.zodiac.symbol}</span>}
          </h1>
          <p className="mt-3 text-[13px] uppercase tracking-[0.2em] text-[#751545]/55">
            {r.age ? `${r.age} years old` : ''} {r.age && r.zodiac ? '·' : ''}{' '}
            {r.zodiac ? `${r.zodiac.sign} · ${r.zodiac.element} sign` : ''}
          </p>
        </Reveal>
        <Reveal delay={200} className="mt-12">
          <div className="gold-ring mx-auto max-w-2xl rounded-[2rem] bg-white/80 p-10 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Your archetype</p>
            <h2 className="font-display mt-4 text-3xl font-medium text-[#751545] md:text-5xl">{r.styleName}</h2>
            <p className="font-display mt-6 text-xl font-light italic leading-relaxed text-[#3d0b26] md:text-2xl">
              “{r.headline}”
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── The pattern ── */}
      <section className="border-y border-[#751545]/10 bg-white/60 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionTitle kicker="Reading I — what your answers revealed">The pattern you didn’t know you were running</SectionTitle>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-8 text-[16px] leading-relaxed text-[#4a1230]/80">{r.subheadline}</p>
          </Reveal>
          <div className="mt-10 flex flex-col gap-5">
            {r.pattern.map((p, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="flex gap-4 rounded-2xl border border-[#751545]/12 bg-[#fbf5ef] p-6">
                  <span className="font-display shrink-0 text-2xl text-[#c9a24b]">✦</span>
                  <p className="text-[15px] leading-relaxed text-[#4a1230]/85">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Father wound ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionTitle kicker="Reading II — the root">Where it started: the first man in your life</SectionTitle>
          </Reveal>
          <Reveal delay={140}>
            <p className="font-display mt-8 border-l-2 border-[#c9a24b] pl-6 text-xl font-light italic leading-relaxed text-[#3d0b26] md:text-[1.4rem]">
              {r.fatherWound}
            </p>
          </Reveal>
          {r.herWords && (
            <Reveal delay={220} className="mt-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">In your own words</p>
              <div className="mt-4 rounded-2xl bg-[#3d0b26] p-8">
                <p className="font-display text-lg font-light italic leading-relaxed text-[#fbf5ef]/90">
                  “{r.herWords}”
                </p>
                <p className="mt-4 text-[13px] leading-relaxed text-[#fbf5ef]/60">
                  — You wrote this. Now read it as if your best friend had written it. Notice the
                  self-blame woven through it? That’s the pattern speaking, not the truth. The truth
                  is in the next section.
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── The real reason ── */}
      <section className="border-y border-[#751545]/10 bg-gradient-to-b from-[#751545] to-[#3d0b26] px-6 py-28 text-[#fbf5ef]">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">
              Reading III — the revelation
            </p>
            <h2 className="font-display mt-4 text-3xl font-medium leading-tight md:text-4xl">
              Why you’re still single.
              <em className="font-light text-[#e9babb]"> The part no one tells you.</em>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-10 text-[17px] font-light leading-[1.85] text-[#fbf5ef]/90">{r.realReason}</p>
          </Reveal>
        </div>
      </section>

      {/* ── The man she needs ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionTitle kicker="Reading IV — who to choose">The man you actually need — not the one you keep choosing</SectionTitle>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {r.manSheNeeds.map((m, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-[#751545]/12 bg-white/80 p-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#751545] to-[#c4688a] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-[#4a1230]/85">{m}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 90-day path ── */}
      <section className="border-y border-[#751545]/10 bg-white/60 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionTitle kicker="Reading V — the way forward">Your 90-day path: from pattern to proposal</SectionTitle>
          </Reveal>
          <div className="mt-12 flex flex-col gap-0">
            {r.path.map((s, i) => (
              <Reveal key={i} delay={i * 130}>
                <div className="relative flex gap-6 pb-10">
                  <div className="flex flex-col items-center">
                    <div className="gold-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a24b] to-[#edc840] font-display text-lg font-semibold text-[#3d0b26]">
                      {i + 1}
                    </div>
                    {i < r.path.length - 1 && <div className="mt-2 w-px flex-1 bg-gradient-to-b from-[#c9a24b]/60 to-transparent" />}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-display text-xl font-medium text-[#3d0b26]">{s.title}</h3>
                    <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#4a1230]/75">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ── */}
      <section className="px-6 py-28 text-center">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">One question remains</p>
          <h2 className="font-display mx-auto mt-5 max-w-2xl text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
            {r.name}, knowing the pattern is 20% of the work.
            <em className="font-light text-[#751545]"> Breaking it is the other 80.</em>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[15.5px] leading-relaxed text-[#4a1230]/75">
            Your full Revela Blueprint — the complete 40-page reading, your personalized scripts,
            the Consistency Test, and a private session with one of our doctors — is reserved for
            women who finish this assessment. You finished.
          </p>
        </Reveal>
        <Reveal delay={160} className="mt-10">
          <div className="flex flex-col items-center gap-3">
            <button className="btn-shine group flex items-center gap-3 rounded-full px-10 py-5 text-base font-semibold text-white md:text-lg">
              <span>Unlock My Full Blueprint</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </button>
            <p className="text-xs text-[#751545]/60">
              A copy of this report has been sent to {answers.email || 'your inbox'}.
            </p>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[#751545]/10 px-6 py-8 text-center">
        <p className="text-[11.5px] leading-relaxed text-[#4a1230]/50">
          © 2026 Revela Institute · This report is educational self-reflection content, not medical or psychological advice.
        </p>
      </footer>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { REVIEWS } from '../lib/engine';

/* ── tiny reveal-on-scroll hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
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
        transform: seen ? 'translateY(0)' : 'translateY(34px)',
        transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Stars({ size = 'text-sm' }: { size?: string }) {
  return (
    <div className={`flex gap-[2px] star-gold ${size}`}>
      {'★★★★★'.split('').map((s, i) => (
        <span key={i}>{s}</span>
      ))}
    </div>
  );
}

function CTAButton({
  onStart,
  children,
  sub,
  resume,
  onRestart,
}: {
  onStart: () => void;
  children: React.ReactNode;
  sub?: string;
  resume?: boolean;
  onRestart?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onStart}
        className="btn-shine group flex items-center gap-3 rounded-full px-9 py-4 text-base font-semibold tracking-wide text-white md:px-12 md:py-5 md:text-lg"
      >
        <span>{resume ? 'Continue where you left off' : children}</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
      </button>
      {resume && (
        <p className="text-[13px] text-[#751545]/70">
          Welcome back — your answers are saved.{' '}
          <button onClick={onRestart} className="font-medium text-[#751545] underline underline-offset-2">
            start over instead
          </button>
        </p>
      )}
      {!resume && sub && <p className="text-xs tracking-wide text-[#751545]/60">{sub}</p>}
    </div>
  );
}

const TEAM = [
  {
    name: 'Dr. Elena Marchetti, PhD',
    role: 'Attachment Science · Lead Researcher',
    bio: 'Formerly of the University of Milan’s Relationship Science Lab. 14 years mapping how childhood imprints script adult partner selection.',
  },
  {
    name: 'Dr. Naomi Okafor, PhD',
    role: 'Clinical Psychology · Pattern Analysis',
    bio: 'Specialist in reparenting and schema therapy. Designed the 21-question instrument that locates a woman’s core relational wound in under 10 minutes.',
  },
  {
    name: 'Dr. Claire Aubert, PhD',
    role: 'Behavioral Science · Commitment Dynamics',
    bio: 'Researches the courtship-to-commitment window: why some courtships become marriages and most quietly expire. Architect of the Revela 90-day path.',
  },
];

const STATS = [
  { n: '38,000+', l: 'women decoded' },
  { n: '4.9 / 5', l: 'average rating' },
  { n: '92%', l: 'say it “read them accurately”' },
  { n: '71%', l: 'in a committed relationship within 12 months*' },
];

export default function Landing({
  onStart,
  resume = false,
  onRestart,
}: {
  onStart: () => void;
  resume?: boolean;
  onRestart?: () => void;
}) {
  return (
    <div className="bg-grain min-h-screen">
      {/* ── Nav ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tracking-tight text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a24b]">Institute</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#4a1230]/75 md:flex">
            <a href="#science" className="transition-colors hover:text-[#751545]">The Science</a>
            <a href="#team" className="transition-colors hover:text-[#751545]">Our Doctors</a>
            <a href="#stories" className="transition-colors hover:text-[#751545]">Stories</a>
          </nav>
          <button
            onClick={onStart}
            className="btn-shine rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <span>Take the Assessment</span>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
        <div className="animate-float-slow pointer-events-none absolute left-[8%] top-[18%] hidden text-6xl text-[#c4688a]/25 lg:block">✦</div>
        <div className="animate-float-slow pointer-events-none absolute right-[10%] top-[30%] hidden text-5xl text-[#c9a24b]/30 lg:block" style={{ animationDelay: '-3s' }}>❋</div>
        <div className="animate-float-slow pointer-events-none absolute bottom-[20%] left-[15%] hidden text-4xl text-[#751545]/20 lg:block" style={{ animationDelay: '-1.5s' }}>✧</div>

        <Reveal>
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">
            For the woman who is done guessing
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="font-display max-w-4xl text-[2.6rem] font-medium leading-[1.08] tracking-[-0.02em] text-[#3d0b26] md:text-6xl lg:text-[4.4rem]">
            You don’t have a dating problem.
            <br />
            <em className="font-light text-[#751545]">You have a pattern.</em>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">
            Revela decodes why love keeps stalling — the childhood imprint, the father template,
            the exes with different faces but the same ending — and hands you the exact path from
            where you are to the ring, the marriage, the family.
          </p>
        </Reveal>
        <Reveal delay={360} className="mt-10">
          <CTAButton onStart={onStart} sub="Free · 21 questions · ~7 minutes · results instantly" resume={resume} onRestart={onRestart}>
            Discover Your Pattern
          </CTAButton>
        </Reveal>
        <Reveal delay={480} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-[#4a1230]/60">
            <span className="flex items-center gap-2"><Stars size="text-xs" /> 4.9 from 11,240 verified reviews</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 md:block" />
            <span>Built by PhDs in attachment science</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 md:block" />
            <span>Private & encrypted</span>
          </div>
        </Reveal>
      </section>

      {/* ── Stats band ── */}
      <section className="border-y border-[#751545]/12 bg-[#3d0b26] py-14 text-[#fbf5ef]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.l} delay={i * 100} className="text-center">
              <p className="font-display text-4xl font-medium text-[#edc840] md:text-5xl">{s.n}</p>
              <p className="mt-2 text-[13px] leading-snug text-[#fbf5ef]/70">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">The quiet truth</p>
          <h2 className="font-display mt-5 text-3xl font-medium leading-tight tracking-[-0.01em] text-[#3d0b26] md:text-5xl">
            You’re not too picky. You’re not too old.
            <br />
            <em className="font-light text-[#751545]">You’re running an old script.</em>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">
            Every woman carries an invisible blueprint for love — written by her childhood home,
            her father’s presence or absence, her mother’s definition of love, and every man who
            confirmed the story since. Until you read the blueprint, you will keep dating it.
            Revela makes it readable — in 21 questions.
          </p>
        </Reveal>
        <Reveal delay={250} className="mt-10">
          <CTAButton onStart={onStart} resume={resume} onRestart={onRestart}>Read My Blueprint</CTAButton>
        </Reveal>
      </section>

      {/* ── Science ── */}
      <section id="science" className="border-y border-[#751545]/10 bg-white/60 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">The science underneath</p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
              Not horoscopes. Not vibes.
              <br />
              <em className="font-light text-[#751545]">Seventy years of attachment research.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Attachment theory',
                d: 'Pioneered by John Bowlby and Mary Ainsworth, extended to adult romance by Hazan & Shaver — the framework showing that the bond you formed before age five predicts how you love at thirty-five.',
              },
              {
                n: '02',
                t: 'Imago & template selection',
                d: 'Clinical research on partner selection shows we choose partners who match our earliest caregivers — not our stated preferences. This is why your exes rhyme.',
              },
              {
                n: '03',
                t: 'Schema repatterning',
                d: 'Modern schema therapy demonstrates that naming a relational pattern — precisely, personally — is the single strongest predictor of breaking it. That naming is what your report delivers.',
              },
            ].map((c, i) => (
              <Reveal key={c.n} delay={i * 130}>
                <p className="font-display text-5xl font-light text-[#e9babb]">{c.n}</p>
                <h3 className="font-display mt-4 text-xl font-medium text-[#3d0b26]">{c.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#4a1230]/70">{c.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">How Revela works</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            Seven minutes. <em className="font-light text-[#751545]">Three acts.</em>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {[
            {
              t: 'The Assessment',
              d: '21 questions across five chapters — your childhood, your parents, your exes, your reflexes, your dream. Answer honestly; the instrument does the rest.',
              icon: '✎',
            },
            {
              t: 'The Analysis',
              d: 'Your answers are mapped against our pattern library of 38,000+ female profiles and four attachment archetypes. Watch it work — it takes about 20 seconds.',
              icon: '❋',
            },
            {
              t: 'The Revelation',
              d: 'A personal report that names your pattern, traces it to its root, and lays out your 90-day path to marriage and the family you want. Most women read it twice.',
              icon: '✦',
            },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 130}>
              <div className="gold-ring h-full rounded-3xl bg-white/80 p-8 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#751545] to-[#c4688a] text-xl text-white">
                  {s.icon}
                </div>
                <h3 className="font-display mt-5 text-xl font-medium text-[#3d0b26]">{s.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#4a1230]/70">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" className="border-y border-[#751545]/10 bg-[#3d0b26] py-28 text-[#fbf5ef]">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">The minds behind Revela</p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight md:text-5xl">
              Developed by doctors who have spent their careers
              <em className="font-light text-[#e9babb]"> inside the female heart.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {TEAM.map((m, i) => (
              <Reveal key={m.name} delay={i * 130}>
                <div className="h-full rounded-3xl border border-[#fbf5ef]/12 bg-[#fbf5ef]/[0.04] p-8">
                  <div className="font-display flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a24b] to-[#edc840] text-2xl font-semibold text-[#3d0b26]">
                    {m.name.split(' ')[1][0]}
                    {m.name.split(' ')[2][0]}
                  </div>
                  <h3 className="font-display mt-5 text-lg font-medium">{m.name}</h3>
                  <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-[#edc840]/90">{m.role}</p>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-[#fbf5ef]/70">{m.bio}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stories / reviews marquee ── */}
      <section id="stories" className="overflow-hidden py-28">
        <Reveal className="px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">38,000 women. One mirror.</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            They answered. <em className="font-light text-[#751545]">Then everything moved.</em>
          </h2>
        </Reveal>
        <div className="relative mt-14">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#fbf5ef] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#fbf5ef] to-transparent" />
          <div className="animate-marquee flex w-max gap-6 pr-6">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="w-[340px] shrink-0 rounded-3xl border border-[#751545]/10 bg-white/85 p-6 shadow-sm">
                <Stars size="text-xs" />
                <p className="mt-3 text-[14px] leading-relaxed text-[#4a1230]/85">“{r.text}”</p>
                <p className="mt-4 text-[12px] font-semibold text-[#3d0b26]">
                  {r.name} <span className="font-normal text-[#751545]/50">· {r.place}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fbf5ef] to-[#f3e8df] px-6 py-32 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4688a]/10 blur-3xl" />
        <Reveal>
          <h2 className="font-display mx-auto max-w-3xl text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
            Somewhere between question 1 and question 21,
            <em className="font-light text-[#751545]"> you’ll meet yourself.</em>
          </h2>
        </Reveal>
        <Reveal delay={150} className="mt-10">
          <CTAButton onStart={onStart} sub="Free · private · your results in minutes" resume={resume} onRestart={onRestart}>
            Begin My Assessment
          </CTAButton>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#751545]/10 bg-[#fbf5ef] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <span className="font-display text-xl font-semibold text-[#3d0b26]">Revela</span>
          <p className="max-w-xl text-[11.5px] leading-relaxed text-[#4a1230]/50">
            *Self-reported outcomes from member follow-up surveys. Revela provides educational
            self-reflection content and is not a substitute for licensed therapy or medical advice.
            Your data is encrypted and never sold.
          </p>
          <p className="text-[11px] text-[#4a1230]/40">© 2026 Revela Institute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

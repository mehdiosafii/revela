import { useEffect, useRef, useState } from 'react';
import { REVIEWS } from '../lib/engine';

/* ── reveal-on-scroll ── */
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

/* ── scarcity: deterministic "spots left today" (resets daily, ticks down) ── */
function useSpotsLeft() {
  const [spots, setSpots] = useState(0);
  useEffect(() => {
    const day = Math.floor(Date.now() / 86400000);
    const seed = (day * 2654435761) % 1000;
    const start = 187 + (seed % 40); // 187–226 taken at midnight
    const total = 300;
    const minutesToday = Math.floor((Date.now() % 86400000) / 60000);
    const taken = Math.min(total - 11, start + Math.floor(minutesToday * 0.09));
    setSpots(total - taken);
  }, []);
  return spots;
}

const STATS = [
  { n: '38,000+', l: 'women decoded' },
  { n: '4.9 / 5', l: 'average rating' },
  { n: '92%', l: 'say it “read them accurately”' },
  { n: '71%', l: 'in a committed relationship within 12 months*' },
];

const PAIN_POINTS = [
  'You’re the successful one at brunch — and the only one going home alone.',
  'Every situationship starts electric and ends with “he’s not ready.”',
  'You’ve read the books, done the therapy, tried the apps. Same ending, different man.',
  'Your friends with half your standards are getting proposed to. You get “you’re intimidating.”',
  'You’re not afraid of dying alone. You’re afraid of wasting another three years finding out.',
];

const FAILURES = [
  {
    t: 'Dating apps',
    d: 'They sell you access, not answers. Swiping changes who you meet — not why you choose them.',
  },
  {
    t: 'Therapy',
    d: 'Wonderful for healing. But 60-minute sessions drift — you need a targeted map of your romantic pattern, not open-ended exploration.',
  },
  {
    t: 'Advice from friends',
    d: '“Just love yourself first” is not a strategy. Your friends see your highlight reel, not your attachment imprint.',
  },
];

const VALUE_STACK = [
  { item: 'Your Attachment Archetype — the exact pattern running your love life, named', value: 97 },
  { item: 'The Root-Cause Trace — your father template & childhood imprint, decoded', value: 147 },
  { item: 'The Ex Pattern Map — why they all rhymed, laid out in plain language', value: 67 },
  { item: '“The Real Reason You’re Still Single” — the sentence no one has said to you', value: 197 },
  { item: 'Your 90-Day Path — week-by-week moves from pattern to proposal', value: 197 },
];

const NOT_FOR = [
  'Women looking for pickup tricks or manipulation tactics.',
  'Women who want a horoscope to blame instead of a mirror to face.',
  'Women who aren’t willing to answer 21 honest questions about themselves.',
];

const FAQ = [
  {
    q: 'Is it really free? What’s the catch?',
    a: 'The assessment and your core report are free. We make money when a small percentage of women choose to go deeper with the full Blueprint or a private session — after they’ve seen the quality of the free reading. You get the value first. That’s the whole model.',
  },
  {
    q: 'How can 21 questions know anything real about me?',
    a: 'Because the questions aren’t random. They’re built on 70 years of attachment research and calibrated against 38,000+ female profiles. Most women describe the report as “uncomfortably specific.” That specificity is the product.',
  },
  {
    q: 'I’m over 35. Is this going to tell me it’s too late?',
    a: 'No — because it isn’t. The average Revela member is 33. The pattern that kept you single at 27 is the same one operating now, which means fixing it works now. The timeline is shorter, so the precision matters more.',
  },
  {
    q: 'Is this therapy?',
    a: 'No. Revela is a diagnostic and a strategy — it shows you the pattern and the path. Many members bring their report to their therapist and say it saved them months.',
  },
  {
    q: 'Are my answers private?',
    a: 'Encrypted, never sold, never shared. Your photo (optional) is never published anywhere. You can request deletion of everything, anytime.',
  },
  {
    q: 'What if the report is wrong about me?',
    a: 'Then you lost seven minutes. But 92% of women say it “read them accurately” — and the ones it helps don’t get that time back either. They get a marriage.',
  },
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
  const spots = useSpotsLeft();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-grain min-h-screen pb-20 md:pb-0">
      {/* ── Scarcity bar ── */}
      <div className="fixed inset-x-0 top-0 z-[60] bg-[#3d0b26] px-4 py-2 text-center">
        <p className="text-[11.5px] font-medium tracking-wide text-[#fbf5ef]/90">
          Free analysis this week only —{' '}
          <span className="font-semibold text-[#edc840]">{spots > 0 ? spots : 11} spots left today</span>
          <span className="hidden sm:inline text-[#fbf5ef]/50"> · quality cap: 300 reports/day</span>
        </p>
      </div>

      {/* ── Nav ── */}
      <header className="fixed inset-x-0 top-[34px] z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tracking-tight text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a24b]">Institute</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#4a1230]/75 md:flex">
            <a href="#method" className="transition-colors hover:text-[#751545]">The Method</a>
            <a href="#team" className="transition-colors hover:text-[#751545]">Our Doctors</a>
            <a href="#stories" className="transition-colors hover:text-[#751545]">Results</a>
            <a href="#faq" className="transition-colors hover:text-[#751545]">FAQ</a>
          </nav>
          <button onClick={onStart} className="btn-shine rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            <span>{resume ? 'Continue' : 'Get My Free Reading'}</span>
          </button>
        </div>
      </header>

      {/* ── Hero: call-out headline ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-36 pb-16 text-center">
        <div className="animate-float-slow pointer-events-none absolute left-[8%] top-[18%] hidden text-6xl text-[#c4688a]/25 lg:block">✦</div>
        <div className="animate-float-slow pointer-events-none absolute right-[10%] top-[30%] hidden text-5xl text-[#c9a24b]/30 lg:block" style={{ animationDelay: '-3s' }}>❋</div>

        <Reveal>
          <p className="mb-6 inline-block rounded-full border border-[#c9a24b]/40 bg-white/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#751545]">
            For women who are done wasting years
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="font-display max-w-4xl text-[2.4rem] font-medium leading-[1.1] tracking-[-0.02em] text-[#3d0b26] md:text-6xl lg:text-[4.2rem]">
            If you keep attracting men
            <br />
            who won’t commit —{' '}
            <em className="font-light text-[#751545]">this 7-minute assessment shows you exactly why.</em>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">
            Revela’s <b>Pattern Decoding Method™</b> finds the invisible script written by your
            childhood, your father, and your exes — the one that’s been choosing your men for you —
            and hands you the 90-day plan to break it. <b>Free. Private. Uncomfortably accurate.</b>
          </p>
        </Reveal>
        <Reveal delay={360} className="mt-10">
          <CTAButton onStart={onStart} resume={resume} onRestart={onRestart}
            sub="Free · 21 questions · 7 minutes · your report appears instantly">
            Show Me My Pattern — Free
          </CTAButton>
        </Reveal>
        <Reveal delay={480} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-[#4a1230]/60">
            <span className="flex items-center gap-2"><Stars size="text-xs" /> 4.9 · 11,240 verified reviews</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 md:block" />
            <span>Built by 3 PhDs in attachment science</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 md:block" />
            <span>38,000+ women decoded</span>
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

      {/* ── Pain agitation ── */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Read this slowly</p>
          <h2 className="font-display mt-5 text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
            Does any of this sound
            <em className="font-light text-[#751545]"> uncomfortably familiar?</em>
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-col gap-4">
          {PAIN_POINTS.map((p, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="flex items-start gap-4 rounded-2xl border border-[#751545]/10 bg-white/75 p-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#751545]/10 text-[13px] text-[#751545]">✕</span>
                <p className="text-[15.5px] leading-relaxed text-[#4a1230]/85">{p}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="font-display mt-10 text-center text-xl font-light italic leading-relaxed text-[#3d0b26] md:text-2xl">
            If you nodded at even two of these — you don’t have bad luck.
            <br />
            <b className="font-medium not-italic text-[#751545]">You have a pattern. And patterns can be broken.</b>
          </p>
        </Reveal>
      </section>

      {/* ── Why nothing worked / the mechanism ── */}
      <section id="method" className="border-y border-[#751545]/10 bg-white/60 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Why nothing has worked yet</p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
              You’ve been treating the symptom.
              <br />
              <em className="font-light text-[#751545]">The disease is a script you can’t see.</em>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {FAILURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 120}>
                <p className="font-display text-lg font-medium text-[#751545] line-through decoration-[#c4688a]/60 decoration-2">{f.t}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#4a1230]/70">{f.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150}>
            <div className="gold-ring mt-16 rounded-[2rem] bg-[#3d0b26] p-10 text-[#fbf5ef] md:p-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">The Pattern Decoding Method™</p>
              <h3 className="font-display mt-4 max-w-2xl text-2xl font-medium leading-snug md:text-4xl">
                Name the pattern precisely — and it loses its power over you.
              </h3>
              <p className="mt-6 max-w-2xl text-[15.5px] leading-relaxed text-[#fbf5ef]/75">
                Built on 70 years of attachment research (Bowlby, Ainsworth, Hazan & Shaver) and calibrated
                against 38,000+ female profiles, the Method locates your exact imprint — the father template,
                the childhood rule about love, the reflex that fires when he pulls away — in 21 targeted
                questions. Not because it’s magic. Because your pattern has been repeating so faithfully
                that it’s legible to anyone who knows where to look.
              </p>
              <div className="mt-8 grid gap-6 text-[14px] text-[#fbf5ef]/80 md:grid-cols-3">
                {[
                  ['01', 'Decode', 'The assessment maps your attachment imprint across five chapters of your life.'],
                  ['02', 'Reveal', 'Your report names the pattern, traces it to its root, and shows you the man you actually need.'],
                  ['03', 'Break', 'A 90-day path with concrete scripts takes you from pattern to proposal.'],
                ].map(([n, t, d]) => (
                  <div key={n}>
                    <p className="font-display text-3xl font-light text-[#c4688a]">{n}</p>
                    <p className="font-display mt-2 text-lg font-medium">{t}</p>
                    <p className="mt-2 leading-relaxed text-[#fbf5ef]/65">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Value stack ── */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Everything you get — free, today</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            Here’s exactly what’s inside
            <em className="font-light text-[#751545]"> your free report.</em>
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-col gap-3">
          {VALUE_STACK.map((v, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#751545]/10 bg-white/80 px-6 py-4">
                <p className="text-[15px] leading-snug text-[#3d0b26]">{v.item}</p>
                <p className="shrink-0 text-[14px] tabular-nums">
                  <span className="text-[#751545]/40 line-through">${v.value}</span>{' '}
                  <span className="font-bold text-[#751545]">FREE</span>
                </p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={420}>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#3d0b26] px-6 py-5">
              <p className="font-display text-lg font-medium text-[#fbf5ef]">Total real value</p>
              <p className="font-display text-2xl text-[#edc840]">
                <span className="text-base text-[#fbf5ef]/40 line-through">$705</span> — $0
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal delay={200} className="mt-10">
          <CTAButton onStart={onStart} resume={resume} onRestart={onRestart}
            sub="No card. No signup wall. Answer 21 questions, get your report.">
            Claim My Free Report
          </CTAButton>
        </Reveal>
      </section>

      {/* ── Disqualification ── */}
      <section className="border-y border-[#751545]/10 bg-white/60 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Fair warning</p>
            <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-4xl">
              Revela is <em className="font-light text-[#751545]">not</em> for everyone.
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {NOT_FOR.map((n, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="flex items-start gap-4 rounded-2xl border border-[#751545]/10 bg-[#fbf5ef] p-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3d0b26] text-[12px] text-[#edc840]">✕</span>
                  <p className="text-[15px] leading-relaxed text-[#4a1230]/85">{n}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="font-display mt-8 text-xl font-light italic text-[#3d0b26]">
              It <b className="font-medium not-italic text-[#751545]">is</b> for the woman who wants the truth more than she wants comfort — and a husband more than she wants excuses.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" className="border-b border-[#751545]/10 bg-[#3d0b26] py-28 text-[#fbf5ef]">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">Built by scientists, not influencers</p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight md:text-5xl">
              Three doctors. Fourteen years each.
              <em className="font-light text-[#e9babb]"> One obsession: why good women stay single.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
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
            ].map((m, i) => (
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

      {/* ── Reviews wall + marquee ── */}
      <section id="stories" className="overflow-hidden py-28">
        <Reveal className="px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Don’t take our word for it</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            38,000 women. One mirror.
            <em className="font-light text-[#751545]"> These are their words.</em>
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

      {/* ── FAQ objections ── */}
      <section id="faq" className="border-y border-[#751545]/10 bg-white/60 px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Every objection, answered</p>
            <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
              You’re skeptical. <em className="font-light text-[#751545]">Good. You should be.</em>
            </h2>
          </Reveal>
          <div className="mt-12 flex flex-col gap-3">
            {FAQ.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="overflow-hidden rounded-2xl border border-[#751545]/10 bg-[#fbf5ef]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[#3d0b26]">{f.q}</span>
                    <span className={`shrink-0 text-[#751545] transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>＋</span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[14.5px] leading-relaxed text-[#4a1230]/75">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA: risk reversal + urgency ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fbf5ef] to-[#f3e8df] px-6 py-32 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4688a]/10 blur-3xl" />
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">The math is simple</p>
          <h2 className="font-display mx-auto mt-5 max-w-3xl text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
            Worst case: you lose 7 minutes.
            <br />
            <em className="font-light text-[#751545]">Best case: you get the ring, the marriage, the family.</em>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[15.5px] leading-relaxed text-[#4a1230]/75">
            No card. No email wall — you see your report before you ever decide anything.
            Encrypted, deletable, yours. The only real risk is spending another year
            repeating a pattern you could have named today.
          </p>
        </Reveal>
        <Reveal delay={160} className="mt-10">
          <CTAButton onStart={onStart} resume={resume} onRestart={onRestart}
            sub={`${spots > 0 ? spots : 11} free spots left today · report appears instantly after question 21`}>
            Show Me My Pattern — Free
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

      {/* ── Sticky mobile CTA ── */}
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#751545]/15 bg-[#fbf5ef]/95 p-3 backdrop-blur-md md:hidden">
        <button onClick={onStart} className="btn-shine w-full rounded-full py-3.5 text-[15px] font-semibold text-white">
          <span>{resume ? 'Continue my assessment →' : 'Get my free reading →'}</span>
        </button>
      </div>
    </div>
  );
}

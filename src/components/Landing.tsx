import { useEffect, useRef, useState } from 'react';
import { REVIEWS } from '../lib/engine';
import { trpc } from '@/providers/trpc';
import { SUPPORT_EMAIL } from '../lib/config';

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

/* ── REAL scarcity: today's actual usage, read from the live database ── */
function useSpotsLeft() {
  const q = trpc.public.spotsLeft.useQuery(undefined, { refetchInterval: 8000, retry: false });
  return q.data ?? null;
}

/* the spot count — pulses gold whenever it drops, so visitors SEE it shrink */
export function SpotNumber({ value }: { value: number }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1600);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span
      className="inline-block font-semibold tabular-nums text-[#edc840] transition-transform duration-300"
      style={flash ? { transform: 'scale(1.35)', textShadow: '0 0 14px rgba(237,200,64,0.9)' } : undefined}
    >
      {value}
    </span>
  );
}

/* live countdown to midnight UTC, when the day's spots reset */
export function useResetCountdown(resetAt: number | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!resetAt) return;
    const tick = () => {
      const ms = resetAt - Date.now();
      if (ms <= 0) {
        setLabel('00h 00m 00s');
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLabel(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [resetAt]);
  return label;
}

function ScarcityBar() {
  const spots = useSpotsLeft();
  const reset = useResetCountdown(spots?.resetAt);
  if (!spots || spots.left <= 0) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-[#3d0b26] px-4 py-2 text-center">
      <p className="text-[11.5px] font-medium tracking-wide text-[#fbf5ef]/90">
        Only <SpotNumber value={spots.left} /> <span className="font-semibold text-[#edc840]">report spots left today</span>
        {reset && (
          <span className="text-[#fbf5ef]/70">
            {' '}· new spots in <span className="font-semibold tabular-nums text-[#edc840]">{reset}</span>
          </span>
        )}
        <span className="hidden text-[#fbf5ef]/50 sm:inline"> — every report gets a real review</span>
      </p>
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
    d: 'Wonderful for healing. But 60-minute sessions drift — sometimes you need a targeted map of your romantic pattern, not open-ended exploration.',
  },
  {
    t: 'Advice from friends',
    d: '“Just love yourself first” is not a strategy. Your friends see your highlight reel, not your attachment imprint.',
  },
];

const INSIDE = [
  'Your Attachment Archetype — the exact pattern running your love life, named',
  'The Root-Cause Trace — your father template & childhood imprint, decoded',
  'The Ex Pattern Map — why they all rhymed, laid out in plain language',
  '“The Real Reason You’re Still Single” — the sentence no one has said to you',
  'Your 90-Day Path — week-by-week moves from pattern to proposal',
];

const NOT_FOR = [
  'Women looking for pickup tricks or manipulation tactics.',
  'Women who want a horoscope to blame instead of a mirror to face.',
  'Women who aren’t willing to answer 21 honest questions about themselves.',
];

const FAQ = [
  {
    q: 'Is it really free? What’s the catch?',
    a: 'The assessment and your core report are genuinely free — no card required. We offer an optional paid Blueprint afterward for women who want the deeper work, but you get the full free reading first and owe nothing.',
  },
  {
    q: 'How can 21 questions know anything real about me?',
    a: 'The questions are built on attachment research developed over seven decades (Bowlby, Ainsworth, Hazan & Shaver) and designed to surface the patterns that research links to partner selection and relationship outcomes.',
  },
  {
    q: 'I’m over 35. Is this going to tell me it’s too late?',
    a: 'No — because it isn’t. The pattern that kept you single at 27 is the same one operating now, which means changing it works now. Revela is educational self-reflection, not a deadline.',
  },
  {
    q: 'Is this therapy?',
    a: 'No. Revela is an educational self-assessment — it shows you a pattern and a suggested path. It is not medical or psychological advice, and many members bring their report to a licensed therapist to go deeper.',
  },
  {
    q: 'Are my answers private?',
    a: 'Yes. Your answers are encrypted, never sold, and never shared. Your photo (optional) is never published. You can request full deletion anytime via our privacy page.',
  },
  {
    q: 'What if the report doesn’t resonate with me?',
    a: 'Then you lost seven minutes and nothing else — the assessment is free and there’s no obligation. It’s a self-reflection tool, not a diagnosis; take what’s useful and leave the rest.',
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const spots = useSpotsLeft();
  const reset = useResetCountdown(spots?.resetAt);

  return (
    <div className="bg-grain min-h-screen pb-20 md:pb-0">
      {/* ── Real scarcity bar (live from the database) ── */}
      <ScarcityBar />

      {/* ── Nav ── */}
      <header className="fixed inset-x-0 top-[33px] z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tracking-tight text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a24b]">Institute</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#4a1230]/75 md:flex">
            <a href="#method" className="transition-colors hover:text-[#751545]">The Method</a>
            <a href="#team" className="transition-colors hover:text-[#751545]">Our Approach</a>
            <a href="#stories" className="transition-colors hover:text-[#751545]">Member Stories</a>
            <a href="#faq" className="transition-colors hover:text-[#751545]">FAQ</a>
          </nav>
          <button onClick={onStart} className="btn-shine rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            <span>{resume ? 'Continue' : 'Get My Free Reading'}</span>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-36 pb-16 text-center">
        <div className="animate-float-slow pointer-events-none absolute left-[8%] top-[18%] hidden text-6xl text-[#c4688a]/25 lg:block">✦</div>
        <div className="animate-float-slow pointer-events-none absolute right-[10%] top-[30%] hidden text-5xl text-[#c9a24b]/30 lg:block" style={{ animationDelay: '-3s' }}>❋</div>

        <Reveal>
          <p className="mb-6 inline-block rounded-full border border-[#c9a24b]/40 bg-white/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#751545]">
            A free self-assessment for women done guessing
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="font-display max-w-4xl text-[2.4rem] font-medium leading-[1.1] tracking-[-0.02em] text-[#3d0b26] md:text-6xl lg:text-[4.2rem]">
            If you keep attracting men
            <br />
            who won’t commit —{' '}
            <em className="font-light text-[#751545]">this 7-minute assessment may show you why.</em>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">
            Revela’s <b>Pattern Decoding Method™</b> helps you see the invisible script shaped by your
            childhood, your father, and your exes — the one that may be choosing your men for you —
            and offers a 90-day self-guided plan to change it. <b>Free. Private. Surprisingly specific.</b>
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
            <span className="flex items-center gap-2"><Stars size="text-xs" /> Rated by our members</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 md:block" />
            <span>Grounded in attachment research</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 md:block" />
            <span>Encrypted & deletable anytime</span>
          </div>
        </Reveal>
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
            If you nodded at even two of these — it may not be bad luck.
            <br />
            <b className="font-medium not-italic text-[#751545]">It may be a pattern. And patterns can change.</b>
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
              <em className="font-light text-[#751545]">The cause may be a script you can’t see.</em>
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
                See the pattern clearly — and it starts to lose its power over you.
              </h3>
              <p className="mt-6 max-w-2xl text-[15.5px] leading-relaxed text-[#fbf5ef]/75">
                Our method is grounded in decades of attachment research (Bowlby, Ainsworth, Hazan &amp; Shaver).
                The assessment looks at your early imprint — the father template, the childhood rule about
                love, the reflex that fires when he pulls away — across 21 targeted questions. It’s not magic
                and it’s not a diagnosis: it’s a structured mirror, built so the pattern you’ve been repeating
                becomes visible enough to change.
              </p>
              <div className="mt-8 grid gap-6 text-[14px] text-[#fbf5ef]/80 md:grid-cols-3">
                {[
                  ['01', 'Decode', 'The assessment maps your attachment imprint across five chapters of your life.'],
                  ['02', 'Reveal', 'Your report names a likely pattern, traces it to its roots, and describes the kind of partner research suggests suits you.'],
                  ['03', 'Practice', 'A self-guided 90-day path with reflection prompts and conversation scripts helps you try new moves.'],
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

      {/* ── What's inside ── */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Everything in your free report</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            Here’s exactly what’s inside —
            <em className="font-light text-[#751545]"> no card required.</em>
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-col gap-3">
          {INSIDE.map((v, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="flex items-center gap-4 rounded-2xl border border-[#751545]/10 bg-white/80 px-6 py-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a24b] to-[#edc840] text-[12px] font-bold text-[#3d0b26]">✓</span>
                <p className="text-[15px] leading-snug text-[#3d0b26]">{v}</p>
              </div>
            </Reveal>
          ))}
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
              It <b className="font-medium not-italic text-[#751545]">is</b> for the woman who wants an honest look at her patterns — and is ready to try something different.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Approach / editorial board ── */}
      <section id="team" className="border-b border-[#751545]/10 bg-[#3d0b26] py-28 text-[#fbf5ef]">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">Our approach</p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight md:text-5xl">
              Grounded in published relationship science —
              <em className="font-light text-[#e9babb]"> not influencer opinions.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                t: 'Attachment theory',
                s: 'Bowlby · Ainsworth · Hazan & Shaver',
                d: 'The research tradition showing how early caregiver bonds shape adult romantic behavior — the scientific backbone of the Revela assessment.',
              },
              {
                t: 'Partner-template research',
                s: 'Imago & schema literature',
                d: 'Clinical work on why people repeatedly choose partners resembling early caregivers — the reason your exes may “rhyme.”',
              },
              {
                t: 'Schema repatterning',
                s: 'Contemporary schema therapy',
                d: 'Evidence that precisely naming a relational pattern is a strong first step toward changing it — which is what your report is designed to do.',
              },
            ].map((m, i) => (
              <Reveal key={m.t} delay={i * 130}>
                <div className="h-full rounded-3xl border border-[#fbf5ef]/12 bg-[#fbf5ef]/[0.04] p-8">
                  <h3 className="font-display text-lg font-medium">{m.t}</h3>
                  <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-[#edc840]/90">{m.s}</p>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-[#fbf5ef]/70">{m.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-10 text-[12px] leading-relaxed text-[#fbf5ef]/45">
              Revela is an educational self-reflection tool informed by published research. It does not provide
              medical or psychological advice, diagnosis, or treatment.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Value stack with anchors ── */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Everything inside your free report</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            Here’s exactly what you get —
            <em className="font-light text-[#751545]"> and what it’s worth.</em>
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-col gap-3">
          {[
            { item: 'Your Attachment Archetype — your love-life pattern, named', value: 97 },
            { item: 'The Root-Cause Trace — your father template & childhood imprint, decoded', value: 147 },
            { item: 'The Ex Pattern Map — why they all rhymed, in plain language', value: 67 },
            { item: '“The Real Reason You’re Still Single” — your personal reading', value: 197 },
            { item: 'Your 90-Day Path — week-by-week moves from pattern to proposal', value: 197 },
          ].map((v, i) => (
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
              <p className="font-display text-lg font-medium text-[#fbf5ef]">Total value</p>
              <p className="font-display text-2xl text-[#edc840]">
                <span className="text-base text-[#fbf5ef]/40 line-through">$705</span> — $0 today
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

      {/* ── Member stories ── */}
      <section id="stories" className="overflow-hidden py-28">
        <Reveal className="px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Member stories</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-5xl">
            What women say after
            <em className="font-light text-[#751545]"> seeing their pattern.</em>
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
        <p className="mt-8 px-6 text-center text-[11px] text-[#4a1230]/40">
          Stories reflect individual experiences; results vary and are not guaranteed.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-y border-[#751545]/10 bg-white/60 px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Questions, answered honestly</p>
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

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fbf5ef] to-[#f3e8df] px-6 py-32 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4688a]/10 blur-3xl" />
        <Reveal>
          <h2 className="font-display mx-auto max-w-3xl text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
            Seven minutes of honesty —
            <em className="font-light text-[#751545]"> a clearer picture of your love life.</em>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[15.5px] leading-relaxed text-[#4a1230]/75">
            No card. No email wall — you see your report before you ever decide anything.
            Encrypted, deletable, yours.
          </p>
        </Reveal>
        <Reveal delay={160} className="mt-10">
          <CTAButton onStart={onStart} resume={resume} onRestart={onRestart}
            sub={
              spots
                ? reset
                  ? `Only ${spots.left} report spots left today — new spots in ${reset} · your report appears instantly after question 21`
                  : `Only ${spots.left} report spots left today · your report appears instantly after question 21`
                : 'Your report appears instantly after question 21'
            }>
            Show Me My Pattern — Free
          </CTAButton>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#751545]/10 bg-[#fbf5ef] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <span className="font-display text-xl font-semibold text-[#3d0b26]">Revela</span>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-[#751545]/70">
            <a href="/privacy" className="hover:text-[#751545]">Privacy Policy</a>
            <a href="/terms" className="hover:text-[#751545]">Terms of Service</a>
            <a href="/refund" className="hover:text-[#751545]">Refund Policy</a>
            <a href="/contact" className="hover:text-[#751545]">Contact</a>
          </div>
          <p className="max-w-xl text-[11.5px] leading-relaxed text-[#4a1230]/50">
            Revela provides educational self-reflection content informed by published attachment research.
            It is not medical or psychological advice, diagnosis, or treatment, and is not a substitute for
            licensed therapy. Individual experiences vary. Your data is encrypted and never sold.
          </p>
          <p className="text-[11px] text-[#4a1230]/40">
            © 2026 Revela · operated by Foorsa LLC · {SUPPORT_EMAIL} · All rights reserved.
          </p>
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

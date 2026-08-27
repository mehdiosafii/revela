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
    d: 'They help you meet more people. They do not explain who you keep choosing.',
  },
  {
    t: 'Therapy',
    d: 'It can support deep healing. Revela gives you a focused place to begin — not a replacement for therapy.',
  },
  {
    t: 'Advice from friends',
    d: 'They know your story. They may not see the pattern underneath it.',
  },
];

const RESEARCH_FOUNDATIONS = [
  {
    name: 'Phillip R. Shaver, PhD',
    focus: 'Adult attachment',
    role: 'Distinguished Professor Emeritus · UC Davis',
    bio: 'His research helped extend attachment theory into adult romantic love, couple communication, loss, and the mental processes that shape close relationships.',
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Phillip_R._Shaver.jpg/960px-Phillip_R._Shaver.jpg',
    portraitPosition: 'object-[center_28%]',
    profile: 'https://psychology.ucdavis.edu/people/phillip-shaver',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Phillip_R._Shaver.jpg',
    photoCredit: 'Coloj F. Kiloh · CC0',
  },
  {
    name: 'Mario Mikulincer, PhD',
    focus: 'Attachment security',
    role: 'Professor of Psychology · Hebrew University',
    bio: 'A leading adult-attachment researcher, his work examines attachment security, emotion regulation, close relationships, resilience, and prosocial behavior.',
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Mario_micolinser.jpg',
    portraitPosition: 'object-center',
    profile: 'https://cris.huji.ac.il/en/persons/mario-mikulincer/',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Mario_micolinser.jpg',
    photoCredit: 'Kobi Kalmanovitz · CC BY-SA 3.0 · cropped',
  },
  {
    name: 'Helen Fisher, PhD',
    focus: 'Romantic love & pair bonding',
    role: 'Biological Anthropologist · Rutgers & Kinsey Institute',
    bio: 'Her research used anthropology and neuroscience to study romantic love, mate choice, attraction, and the biological systems involved in human bonding.',
    portrait: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/HelenFisher2014.jpeg',
    portraitPosition: 'object-[center_22%]',
    profile: 'https://evolution.rutgers.edu/people/ches-associates/ches-associate-member/116-helen-fisher',
    photoSource: 'https://commons.wikimedia.org/wiki/File:HelenFisher2014.jpeg',
    photoCredit: 'Helen Fisher · CC0',
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
  'Pickup tricks or ways to manipulate someone.',
  'A horoscope, diagnosis, or replacement for therapy.',
  'Anyone unwilling to answer honestly and reflect on what may be repeating.',
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
    a: 'Yes. Your answers are never sold or shared with advertisers. Your optional photo is stored privately with your session so authorized Revela team members can view it and create your illustrations. It is never published, and you can request deletion anytime via our privacy page.',
  },
  {
    q: 'What if the report doesn’t resonate with me?',
    a: 'Then you lost seven minutes and nothing else — the assessment is free and there’s no obligation. It’s a self-reflection tool, not a diagnosis; take what’s useful and leave the rest.',
  },
];

function NameCapture({
  onStartWithName,
  resume,
  onStart,
}: {
  onStartWithName: (name: string) => void;
  resume: boolean;
  onStart: () => void;
}) {
  const [name, setName] = useState('');
  const ready = name.trim().length >= 2;
  const submit = () => {
    if (ready) onStartWithName(name.trim());
  };
  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <div className="gold-ring flex items-center gap-2 rounded-full bg-white/90 p-2 shadow-lg shadow-[#751545]/5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Your first name…"
          autoComplete="given-name"
          className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[17px] text-[#3d0b26] placeholder-[#751545]/35 outline-none"
        />
        <button
          onClick={submit}
          disabled={!ready}
          className={`btn-shine shrink-0 rounded-full px-6 py-3 text-[15px] font-semibold text-white transition-opacity ${ready ? '' : 'opacity-40'}`}
        >
          <span>Begin →</span>
        </button>
      </div>
      {resume && (
        <button onClick={onStart} className="mt-4 text-[13px] font-medium text-[#751545] underline underline-offset-4">
          Or continue where you left off
        </button>
      )}
    </div>
  );
}

export default function Landing({
  onStart,
  onStartWithName,
  resume = false,
  onRestart,
}: {
  onStart: () => void;
  onStartWithName: (name: string) => void;
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
            <a href="#researchers" className="transition-colors hover:text-[#751545]">Researchers</a>
            <a href="#stories" className="transition-colors hover:text-[#751545]">Member Stories</a>
            <a href="#faq" className="transition-colors hover:text-[#751545]">FAQ</a>
          </nav>
          <button onClick={onStart} className="btn-shine min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            <span>{resume ? 'Continue' : 'Get My Free Reading'}</span>
          </button>
        </div>
      </header>

      {/* ── Name-first hero ── */}
      <section className="relative flex flex-col items-center px-5 pt-36 pb-16 text-center sm:px-6">
        <div className="animate-float-slow pointer-events-none absolute left-[10%] top-[22%] hidden text-6xl text-[#c4688a]/25 lg:block">✦</div>
        <div className="animate-float-slow pointer-events-none absolute right-[9%] top-[34%] hidden text-5xl text-[#c9a24b]/30 lg:block" style={{ animationDelay: '-3s' }}>❋</div>
        <Reveal>
          <p className="mb-6 inline-block rounded-full border border-[#c9a24b]/40 bg-white/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#751545]">
            A free self-assessment for women done guessing
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="font-display max-w-3xl text-[2.6rem] font-medium leading-[1.08] tracking-[-0.02em] text-[#3d0b26] md:text-6xl">
            First — what should we <em className="font-light text-[#751545]">call you?</em>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">
            The same relationship keeps happening for a reason — 21 questions reveal your pattern, free and instantly. Your reading is written personally for you.
          </p>
        </Reveal>
        <Reveal delay={360} className="w-full">
          <NameCapture onStartWithName={onStartWithName} resume={resume} onStart={onStart} />
        </Reveal>
        <Reveal delay={480} className="mt-6">
          <p className="text-[12.5px] text-[#751545]/55">Free · 21 questions · 7 minutes · your report appears instantly</p>
        </Reveal>
        <Reveal delay={600} className="mt-14 w-full max-w-5xl">
          <div id="how-it-works" className="scroll-mt-28 rounded-[1.75rem] border border-[#751545]/10 bg-white/75 p-6 text-left shadow-[0_22px_70px_-48px_rgba(61,11,38,0.45)] sm:p-8 md:p-10">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">How it works</p>
              <h2 className="font-display mt-3 text-2xl font-medium text-[#3d0b26] md:text-3xl">
                From 21 questions to a clear next step.
              </h2>
            </div>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                ['1', 'Answer', 'Share what has happened in your relationships and how you tend to respond.'],
                ['2', 'See your pattern', 'Your report explains what may be repeating and where it may come from.'],
                ['3', 'Move forward', 'Get a practical 90-day path with prompts and conversation tools.'],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-2xl bg-[#fbf5ef] p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3d0b26] text-sm font-semibold text-[#edc840]">
                    {number}
                  </span>
                  <h3 className="font-display mt-4 text-lg font-medium text-[#3d0b26]">{title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#4a1230]/70">{description}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[12px] text-[#751545]/55">Free · private · no card required</p>
          </div>
        </Reveal>
      </section>

      {/* ── Member stories ── */}
      <section id="stories" className="content-auto overflow-hidden py-28">
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

      {/* ── Research foundations ── */}
      <section id="researchers" className="content-auto relative scroll-mt-28 overflow-hidden border-y border-[#751545]/10 bg-white/65 px-6 py-24 md:py-28">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#c4688a]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#c9a24b]/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">
              The research lineage behind Revela
            </p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
              Meet three scholars who changed how we understand
              <em className="font-light text-[#751545]"> attachment and romantic love.</em>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-[15.5px] leading-relaxed text-[#4a1230]/72 md:text-base">
              Revela draws on the field their published work helped shape — translating established
              relationship science into structured questions for personal reflection.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {RESEARCH_FOUNDATIONS.map((researcher, index) => (
              <Reveal key={researcher.name} delay={index * 120}>
                <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#751545]/10 bg-[#fbf5ef] shadow-[0_20px_60px_-38px_rgba(61,11,38,0.35)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#eadfda]">
                    <img
                      src={researcher.portrait}
                      alt={`Portrait of ${researcher.name}`}
                      className={`h-full w-full object-cover grayscale-[18%] transition duration-500 hover:scale-[1.02] hover:grayscale-0 ${researcher.portraitPosition}`}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[#3d0b26]/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#fbf5ef] backdrop-blur">
                      {researcher.focus}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-medium text-[#3d0b26]">{researcher.name}</h3>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#a24f6d]">
                      {researcher.role}
                    </p>
                    <p className="mt-4 flex-1 text-[14px] leading-relaxed text-[#4a1230]/70">{researcher.bio}</p>
                    <a
                      href={researcher.profile}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 text-[12px] font-semibold text-[#751545] underline decoration-[#c9a24b]/60 underline-offset-4 transition hover:decoration-[#751545]"
                    >
                      View academic profile ↗
                    </a>
                    <a
                      href={researcher.photoSource}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 text-[9.5px] leading-relaxed text-[#4a1230]/38 transition hover:text-[#751545]/65"
                    >
                      Photo: {researcher.photoCredit} ↗
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={360} className="mt-10 text-center">
            <p className="mx-auto max-w-3xl text-[11.5px] leading-relaxed text-[#4a1230]/48">
              These independent scholars are featured for their contributions to the field. They are
              not affiliated with Revela and do not endorse this assessment. Revela is an educational
              self-reflection program, not medical advice, diagnosis, or therapy.
            </p>
            <button onClick={onStart} className="btn-shine mt-8 rounded-full px-7 py-3.5 text-sm font-semibold text-white">
              <span>{resume ? 'Continue my assessment →' : 'Take the research-informed assessment →'}</span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── Social conversation ── */}
      <section className="content-auto relative overflow-hidden border-y border-[#751545]/10 bg-white/60 px-6 py-24 md:py-28">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#c4688a]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-[#c9a24b]/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">
              When the report connects the dots
            </p>
            <h2 className="font-display mt-5 text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
              She expected another quiz.
              <br />
              <em className="font-light text-[#751545]">It revealed the pattern underneath.</em>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-[15.5px] leading-relaxed text-[#4a1230]/72 md:text-base">
              Seven minutes can connect the relationship choices that never seemed connected — and turn
              a vague feeling into a pattern you can finally work with.
            </p>
          </Reveal>

          <Reveal delay={140} className="mt-12">
            <div
              className="-mx-6 overflow-x-auto px-6 pb-3 md:mx-0 md:overflow-visible md:px-0 md:pb-0"
              aria-label="Scrollable illustrative Facebook conversation"
            >
              <div className="w-[720px] rounded-[2rem] border border-[#751545]/10 bg-[#f2e8e3] p-2 shadow-[0_30px_90px_-45px_rgba(61,11,38,0.42)] md:w-full md:p-3">
                <a
                  href="/revela-facebook-conversation.jpg"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the illustrative Facebook conversation at full size"
                  className="block overflow-hidden rounded-[1.55rem] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#751545] focus-visible:ring-offset-4"
                >
                  <picture>
                    <source srcSet="/revela-facebook-conversation.avif" type="image/avif" />
                    <img
                      src="/revela-facebook-conversation.jpg"
                      alt="Illustrative Facebook conversation about a Revela report revealing a repeated relationship pattern"
                      width="1352"
                      height="1696"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="h-auto w-full"
                    />
                  </picture>
                </a>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#4a1230]/45">
              Illustrative conversation based on common questions and reactions. Individual experiences vary.
              <span className="ml-1 font-semibold text-[#751545]/65 md:hidden">
                Swipe to read or tap to open full-size.
              </span>
            </p>
          </Reveal>

          <Reveal delay={220} className="mt-9 text-center">
            <button onClick={onStart} className="btn-shine rounded-full px-7 py-3.5 text-sm font-semibold text-white">
              <span>{resume ? 'Continue my assessment →' : 'See what my report reveals →'}</span>
            </button>
            <p className="mt-3 text-[11.5px] text-[#751545]/50">Free · private · no card required</p>
          </Reveal>
        </div>
      </section>

      {/* ── Pain agitation ── */}
      <section className="content-auto mx-auto max-w-3xl px-6 py-28">
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
      <section id="method" className="content-auto border-y border-[#751545]/10 bg-white/60 py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Why the same pattern keeps repeating</p>
            <h2 className="font-display mt-4 text-3xl font-medium leading-tight text-[#3d0b26] md:text-5xl">
              More dating advice may not be the answer.
              <em className="mt-1 block font-light text-[#751545]">First, see the pattern.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-[#4a1230]/70 md:text-[17px]">
              When the same kind of relationship keeps ending the same way, the problem may not be who you meet.
              It may be the pattern guiding who you choose and how you respond.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {FAILURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 120}>
                <div className="h-full rounded-2xl border border-[#751545]/10 bg-[#fbf5ef] p-5 md:p-6">
                  <p className="font-display text-lg font-medium text-[#3d0b26]">{f.t}</p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#4a1230]/70">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <p className="font-display mx-auto mt-10 max-w-3xl text-center text-xl font-light italic leading-relaxed text-[#3d0b26] md:text-2xl">
              Revela helps you name the pattern underneath — so you can understand it before trying to change it.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 rounded-2xl border border-[#b42318]/20 bg-[#fff4f2] p-6 sm:p-8">
              <h3 className="font-display text-2xl font-medium text-[#b42318] md:text-3xl">
                Revela is <em className="font-light">not</em> for everyone.
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#6f1d18]">
                Revela is for women ready to look honestly at what may be repeating. It is not:
              </p>
              <ul className="mt-5 grid gap-3 md:grid-cols-3">
                {NOT_FOR.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-[#6f1d18]/85">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#b42318] text-[11px] font-bold text-white">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What's inside ── */}
      <section className="content-auto mx-auto max-w-3xl px-6 py-28">
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

      {/* ── Approach / editorial board ── */}
      <section id="research" className="content-auto border-b border-[#751545]/10 bg-[#3d0b26] py-28 text-[#fbf5ef]">
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

      {/* ── FAQ ── */}
      <section id="faq" className="content-auto border-y border-[#751545]/10 bg-white/60 px-6 py-28">
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
      <section className="content-auto relative overflow-hidden bg-gradient-to-b from-[#fbf5ef] to-[#f3e8df] px-6 py-32 text-center">
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

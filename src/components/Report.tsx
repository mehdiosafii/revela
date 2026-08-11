import React, { useEffect, useRef, useState } from 'react';
import { buildReport, type Answers, type Report as BuiltInReport } from '../lib/engine';
import { STRIPE_PAYMENT_LINK, UNLOCK_PRICE, UNLOCK_PRICE_ANCHOR } from '../lib/config';
import { REVIEWS } from '../lib/engine';
import { trpc } from '@/providers/trpc';
import { getToken } from '../lib/tracker';

/* the Claude deep-reading shape (mirrors api/queries/report.ts) */
export interface DeepReport {
  archetype: string;
  archetypeLine: string;
  headline: string;
  hook?: string;
  openingLetter: string;
  corePattern: string;
  rootCause: string;
  hiddenTruth: string;
  herWordsReflected: string;
  manSheNeeds: string[];
  ninetyDayPath: { title: string; text: string }[];
  closingLine: string;
}

/* unified view-model: deep report if present, built-in otherwise */
interface View {
  archetypeName: string;
  archetypeLine: string | null;
  headline: string;
  openingLetter: string[] | null; // paragraphs (deep only)
  subheadline: string; // built-in pattern summary
  pattern: string[];
  corePattern: string[] | null; // deep paragraphs
  fatherWound: string;
  rootCause: string[] | null; // deep paragraphs
  realReason: string;
  hiddenTruth: string[] | null;
  herWords: string | null;
  herWordsReflected: string[] | null;
  manSheNeeds: string[];
  path: { title: string; text: string }[];
  closingLine: string | null;
}

function toView(r: BuiltInReport, deep: DeepReport | null): View {
  // AI payloads are untrusted — coerce anything into string paragraphs
  const paras = (s: unknown): string[] =>
    typeof s === 'string'
      ? s.split(/\n+/).filter(Boolean)
      : Array.isArray(s)
        ? s.filter((x): x is string => typeof x === 'string')
        : [];
  if (deep) {
    return {
      archetypeName: deep.archetype,
      archetypeLine: deep.archetypeLine,
      headline: deep.headline,
      openingLetter: paras(deep.openingLetter),
      subheadline: r.subheadline,
      pattern: r.pattern,
      corePattern: paras(deep.corePattern),
      fatherWound: r.fatherWound,
      rootCause: paras(deep.rootCause),
      realReason: r.realReason,
      hiddenTruth: paras(deep.hiddenTruth),
      herWords: r.herWords,
      herWordsReflected: paras(deep.herWordsReflected),
      manSheNeeds: Array.isArray(deep.manSheNeeds)
        ? deep.manSheNeeds.filter((x): x is string => typeof x === 'string')
        : [],
      path: Array.isArray(deep.ninetyDayPath)
        ? deep.ninetyDayPath
            .filter((p): p is { title: string; text: string } => !!p && typeof p === 'object')
            .map((p) => ({ title: typeof p.title === 'string' ? p.title : '', text: typeof p.text === 'string' ? p.text : '' }))
        : [],
      closingLine: deep.closingLine,
    };
  }
  return {
    archetypeName: r.styleName,
    archetypeLine: null,
    headline: r.headline,
    openingLetter: null,
    subheadline: r.subheadline,
    pattern: r.pattern,
    corePattern: null,
    fatherWound: r.fatherWound,
    rootCause: null,
    realReason: r.realReason,
    hiddenTruth: null,
    herWords: r.herWords,
    herWordsReflected: null,
    manSheNeeds: r.manSheNeeds,
    path: r.path,
    closingLine: null,
  };
}

/* render *emphasis* markers from report text as real italics */
function em(text: unknown): React.ReactNode {
  const parts = (typeof text === 'string' ? text : '').split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i} className="italic">{part}</em> : <React.Fragment key={i}>{part}</React.Fragment>,
  );
}

/* ── REAL 12h finisher deadline — anchored server-side when she finished ── */
function useDeadline(): { label: string | null; expired: boolean } {
  const q = trpc.public.deadline.useQuery(
    { token: getToken() },
    {
      // poll fast until the server anchor exists (the first report ping can be
      // retried by the heartbeat), then settle into a slow refresh
      refetchInterval: (query) => (query.state.data?.deadline ? 60000 : 10000),
      retry: false,
    },
  );
  const [label, setLabel] = useState('');
  const [expired, setExpired] = useState(false);
  const dl = q.data?.deadline ?? null;

  useEffect(() => {
    if (!dl) return;
    const tick = () => {
      const ms = dl - Date.now();
      if (ms <= 0) {
        setLabel('00h 00m 00s');
        setExpired(true);
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLabel(
        `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`,
      );
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [dl]);

  return { label: dl ? label : null, expired };
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setSeen(true), io.disconnect()),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
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

function Stars({ size = 'text-sm' }: { size?: string }) {
  return (
    <span className={`inline-flex gap-0.5 text-[#edc840] ${size}`}>
      {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
    </span>
  );
}

/* the unlock button — used in the overlay, sticky bar, and bottom close */
function UnlockButton({ sub }: { sub?: string }) {
  return (
    <div className="text-center">
      <a
        href={STRIPE_PAYMENT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-shine group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-8 py-4 text-[15px] font-semibold text-white md:text-base"
      >
        <span className="flex h-5 w-5 items-center justify-center">🔓</span>
        <span>Unlock My Full Report — {UNLOCK_PRICE}</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
      </a>
      {sub && <p className="mt-3.5 text-[12px] text-[#751545]/55">{sub}</p>}
    </div>
  );
}

export default function Report({ answers, deep }: { answers: Answers; deep?: DeepReport | null }) {
  const r = buildReport(answers);
  const v = toView(r, deep ?? null);
  const { label: deadline, expired } = useDeadline();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // one luring sentence, personalized from her answers
  const lure =
    r.style === 'anxious'
      ? `${r.name}, your report is ready — and it reveals the exact moment your love starts pushing him away.`
      : r.style === 'avoidant'
        ? `${r.name}, your report is ready — and it reveals why the good ones always start to feel boring.`
        : r.style === 'fearful'
          ? `${r.name}, your report is ready — and it reveals the push-pull that keeps love just out of reach.`
          : `${r.name}, your report is ready — and it reveals the quiet pattern that has been choosing your men for you.`;

  const unlockSub = `Secure checkout via Stripe · one-time payment · read your full report instantly`;

  // the first sentence of her report — shown unblurred, names what she's doing wrong
  const hook =
    (typeof deep?.hook === 'string' && deep.hook.trim()) ||
    (r.style === 'anxious'
      ? `${r.name}, what you're doing — loving harder every time he pulls back — is exactly what pushes him away, and here's why.`
      : r.style === 'avoidant'
        ? `${r.name}, what you're doing — leaving the moment it starts to feel real — is what's keeping you single, and here's why.`
        : r.style === 'fearful'
          ? `${r.name}, what you're doing — pulling him close, then pushing him away — is the very thing breaking your relationships, and here's why.`
          : `${r.name}, what you're doing — letting an old pattern choose your men for you — is what's quietly running your love life, and here's why.`);

  return (
    <div className="bg-grain min-h-screen pb-24">
      {/* ── header ── */}
      <header className="border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tracking-tight text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a24b]">Personal Report</span>
          </div>
          <span className="text-[11px] uppercase tracking-widest text-[#751545]/50">{today}</span>
        </div>
      </header>

      {/* ── teaser: one luring sentence ── */}
      <section className="px-6 pb-14 pt-20 text-center">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">
            Your 21 answers have been read
          </p>
          <h1 className="font-display mx-auto mt-6 max-w-3xl text-3xl font-medium leading-[1.2] tracking-tight text-[#3d0b26] md:text-[2.7rem]">
            {lure.split(' — ')[0]} —{' '}
            <em className="font-light text-[#751545]">{lure.split(' — ')[1]}</em>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <div className="mx-auto mt-9 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-[#c9a24b]/35 bg-white/70 px-7 py-3 text-[12.5px] text-[#4a1230]/70">
            <span>{r.name}{r.age ? ` · ${r.age}` : ''}{r.zodiac ? ` · ${r.zodiac.symbol} ${r.zodiac.sign}` : ''}</span>
            <span className="hidden h-3 w-px bg-[#751545]/20 sm:block" />
            <span>Archetype: <b className="text-[#751545]">{v.archetypeName}</b></span>
            <span className="hidden h-3 w-px bg-[#751545]/20 sm:block" />
            <span className="text-[#c9a24b]">6 readings · written for you</span>
          </div>
        </Reveal>
      </section>

      {/* ── the locked report: first sentence clear, the rest blurred ── */}
      <section className="relative px-4 md:px-6">
        <div className="relative mx-auto max-w-3xl">
          {/* clear opening — the first sentence of her report */}
          <Reveal>
            <div className="rounded-t-[2rem] border border-b-0 border-[#751545]/10 bg-white px-7 pb-9 pt-12 md:px-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">
                Reading I — from your report
              </p>
              <p className="font-display mt-6 text-[1.55rem] font-light leading-[1.45] text-[#3d0b26] md:text-[1.9rem]">
                {hook}
              </p>
              <div className="mt-8 flex items-center gap-3 md:gap-4">
                <div className="h-px min-w-4 flex-1 bg-gradient-to-r from-transparent via-[#c9a24b]/50 to-transparent" />
                <p className="max-w-[70%] text-center text-[10px] uppercase leading-relaxed tracking-[0.22em] text-[#751545]/45 md:max-w-none md:text-[11px] md:tracking-[0.25em]">
                  — and that's only the first sentence
                </p>
                <div className="h-px min-w-4 flex-1 bg-gradient-to-r from-transparent via-[#c9a24b]/50 to-transparent" />
              </div>
            </div>
          </Reveal>

          {/* blurred remainder */}
          <div className="relative">
            <div
              aria-hidden
              className="select-none overflow-hidden rounded-b-[2rem] border-x border-b border-[#751545]/10 bg-white/70 px-7 py-12 md:px-14"
              style={{ filter: 'blur(4px)', pointerEvents: 'none', height: 700 }}
            >
            {/* cover */}
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Prepared exclusively for</p>
              <h2 className="font-display mt-4 text-4xl font-medium text-[#3d0b26] md:text-5xl">
                {r.name} {r.zodiac && <span className="text-3xl text-[#c9a24b]">{r.zodiac.symbol}</span>}
              </h2>
              <p className="mt-3 text-[13px] uppercase tracking-[0.2em] text-[#751545]/55">
                {r.age ? `${r.age} years old` : ''}{r.age && r.zodiac ? ' · ' : ''}{r.zodiac ? `${r.zodiac.sign} · ${r.zodiac.element} sign` : ''}
              </p>
            </div>
            <div className="gold-ring mx-auto mt-10 max-w-xl rounded-[2rem] bg-white/80 p-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Your archetype</p>
              <h3 className="font-display mt-3 text-3xl font-medium text-[#751545]">{v.archetypeName}</h3>
              {v.archetypeLine && <p className="mt-2 text-[14px] italic text-[#4a1230]/60">{v.archetypeLine}</p>}
              <p className="font-display mt-5 text-xl font-light italic leading-relaxed text-[#3d0b26]">“{v.headline}”</p>
            </div>
            {/* reading I — the hook, then it fades */}
            <div className="mt-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">
                {v.openingLetter ? 'Reading I — a letter to you' : 'Reading I — what your answers revealed'}
              </p>
              <h4 className="font-display mt-3 text-2xl font-medium text-[#3d0b26]">
                {v.openingLetter ? 'Read this first, slowly' : 'The pattern you didn’t know you were running'}
              </h4>
              <div className="mt-5 flex flex-col gap-4">
                {(v.openingLetter ?? [v.subheadline]).slice(0, 2).map((para, i) => (
                  <p key={i} className="text-[15.5px] leading-[1.8] text-[#4a1230]/85">{em(para)}</p>
                ))}
              </div>
            </div>
            </div>

            {/* fade + unlock overlay */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full" style={{ background: 'linear-gradient(to bottom, rgba(251,245,239,0.0) 0%, rgba(251,245,239,0.0) 22%, rgba(251,245,239,0.55) 40%, rgba(251,245,239,0.96) 55%, #fbf5ef 65%)' }} />
            <div className="absolute inset-x-0 bottom-8 flex justify-center px-4 md:px-6">
            <Reveal className="w-full max-w-md">
              <div className="rounded-[1.8rem] border border-[#c9a24b]/45 bg-white/95 p-8 text-center shadow-[0_30px_80px_-20px_rgba(61,11,38,0.35)] backdrop-blur-md">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#751545] to-[#c4688a] text-2xl text-white shadow-lg">🔒</span>
                <h3 className="font-display mt-5 text-2xl font-medium text-[#3d0b26]">Your full report is locked</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#4a1230]/75">
                  Six readings, written only for you — the loop, the root, the revelation, the man you actually need, and your 90-day path. Unlock it once. Keep it forever.
                </p>
                {deadline && !expired && (
                  <div className="mt-5 rounded-xl bg-[#3d0b26] px-4 py-3">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#fbf5ef]/60">
                      Your unlock price expires in
                    </p>
                    <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-[#edc840]">{deadline}</p>
                  </div>
                )}
                <div className="mt-6">
                  <p className="mb-4 text-[13px] text-[#4a1230]/60">
                    <span className="mr-2 tabular-nums line-through">{UNLOCK_PRICE_ANCHOR}</span>
                    <span className="font-display text-2xl font-semibold text-[#751545]">{UNLOCK_PRICE}</span>
                    <span className="ml-2 rounded-full bg-[#c9a24b]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#751545]">finisher price</span>
                  </p>
                  <UnlockButton sub={unlockSub} />
                </div>
              </div>
            </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── conversion zone below the paywall ── */}
      <section className="mx-auto max-w-3xl px-6 pt-32">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Inside your report</p>
          <h2 className="font-display mt-5 text-3xl font-medium leading-tight text-[#3d0b26] md:text-4xl">
            Here’s exactly what you’ll
            <em className="font-light text-[#751545]"> read in the next five minutes.</em>
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-col gap-3">
          {[
            ['I', 'The letter', 'Your answers reflected back until the thread between your childhood and your love life becomes impossible to unsee.'],
            ['II', 'The loop', 'The exact sequence you run from first date to ending — what you do, what he experiences, how it closes.'],
            ['III', 'The root', 'Where it started: your father, your home, and the little girl’s logic still choosing your men today.'],
            ['IV', 'The revelation', 'Why you’re still single — the part no one has ever said to you plainly.'],
            ['V', 'Who to choose', 'The four traits of the man who would actually work for you — not the one you keep choosing.'],
            ['VI', 'The 90-day path', 'Three named phases from pattern to proposal, built around your timeline and your dream of a family.'],
          ].map(([num, title, desc], i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="flex items-start gap-5 rounded-2xl border border-[#751545]/10 bg-white/80 px-6 py-5">
                <span className="font-display shrink-0 text-xl font-medium text-[#c9a24b]">{num}</span>
                <div>
                  <p className="font-display text-[17px] font-medium text-[#3d0b26]">{title}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#4a1230]/70">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── her own words, echoed ── */}
      {v.herWords && (
        <section className="mx-auto max-w-2xl px-6 pt-24">
          <Reveal>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">You told us</p>
            <div className="mt-5 rounded-3xl bg-[#3d0b26] p-9 text-center">
              <p className="font-display text-xl font-light italic leading-relaxed text-[#fbf5ef]/90">“{v.herWords}”</p>
              <p className="mt-5 text-[13.5px] leading-relaxed text-[#fbf5ef]/60">
                That’s what you believe. Your report shows you what’s actually true — and it’s kinder, and more fixable, than the story you’ve been carrying.
              </p>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── member stories ── */}
      <section className="overflow-hidden pt-28">
        <Reveal className="px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">Member stories</p>
          <h2 className="font-display mt-5 text-3xl font-medium text-[#3d0b26] md:text-4xl">
            What women say after
            <em className="font-light text-[#751545]"> seeing their pattern.</em>
          </h2>
        </Reveal>
        <div className="relative mt-12">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#fbf5ef] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#fbf5ef] to-transparent" />
          <div className="animate-marquee flex w-max gap-6 pr-6">
            {[...REVIEWS, ...REVIEWS].map((rev, i) => (
              <div key={i} className="w-[340px] shrink-0 rounded-3xl border border-[#751545]/10 bg-white/85 p-6 shadow-sm">
                <Stars size="text-xs" />
                <p className="mt-3 text-[14px] leading-relaxed text-[#4a1230]/85">“{rev.text}”</p>
                <p className="mt-4 text-[12px] font-semibold text-[#3d0b26]">
                  {rev.name} <span className="font-normal text-[#751545]/50">· {rev.place}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-8 px-6 text-center text-[11px] text-[#4a1230]/40">
          Stories reflect individual experiences; results vary and are not guaranteed.
        </p>
      </section>

      {/* ── guarantee + final close ── */}
      <section className="bg-gradient-to-b from-[#fbf5ef] to-[#f3e8df] px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="gold-ring flex items-start gap-5 rounded-2xl bg-white/85 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a24b] to-[#edc840] text-xl text-[#3d0b26]">✓</span>
              <div>
                <p className="font-display text-lg font-medium text-[#3d0b26]">30-day money-back guarantee</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#4a1230]/75">
                  Read your full report. If it doesn’t feel like it was written for you — and only you — email us within 30 days for a full refund. No questions, no forms.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={140} className="mt-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">One question remains, {r.name}</p>
            <h2 className="font-display mx-auto mt-4 max-w-xl text-3xl font-medium leading-tight text-[#3d0b26] md:text-4xl">
              You did the hard part.
              <em className="font-light text-[#751545]"> Now read what it means.</em>
            </h2>
            {deadline && !expired && (
              <p className="mt-5 text-[13px] text-[#751545]/70">
                Your {UNLOCK_PRICE} finisher price expires in{' '}
                <span className="font-display font-semibold tabular-nums text-[#3d0b26]">{deadline}</span>
                {' '}— then it returns to {UNLOCK_PRICE_ANCHOR}.
              </p>
            )}
            <div className="mt-8">
              <UnlockButton sub={`${unlockSub} · a copy is also sent to ${answers.email || 'your inbox'}`} />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-[#751545]/10 px-6 py-8 text-center">
        <p className="text-[11.5px] leading-relaxed text-[#4a1230]/50">
          © 2026 Revela Institute · This report is educational self-reflection content, not medical or psychological advice.
        </p>
      </footer>

      {/* ── sticky unlock bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#751545]/10 bg-[#fbf5ef]/92 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#3d0b26]">
              {r.name}’s report is ready
            </p>
            <p className="text-[11.5px] text-[#751545]/60">
              {deadline && !expired ? (
                <>expires in <span className="font-semibold tabular-nums text-[#751545]">{deadline}</span></>
              ) : (
                <>6 readings · written for you</>
              )}
            </p>
          </div>
          <a
            href={STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          >
            <span>Unlock — {UNLOCK_PRICE}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

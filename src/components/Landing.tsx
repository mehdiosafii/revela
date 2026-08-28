import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { SUPPORT_EMAIL } from '../lib/config';

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: .1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className} style={{ opacity: seen ? 1 : 0, transform: seen ? 'none' : 'translateY(24px)', transition: 'opacity .65s ease, transform .65s ease' }}>{children}</div>;
}

export function SpotNumber({ value }: { value: number }) {
  return <span className="font-semibold tabular-nums text-[#edc840]">{value}</span>;
}

export function useResetCountdown(resetAt: number | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!resetAt) return;
    const tick = () => {
      const ms = Math.max(0, resetAt - Date.now());
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setLabel(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [resetAt]);
  return label;
}

function NameCapture({ onStartWithName, resume, onStart }: { onStartWithName: (name: string) => void; resume: boolean; onStart: () => void }) {
  const [name, setName] = useState('');
  const ready = name.trim().length >= 2;
  const submit = () => ready && onStartWithName(name.trim());
  return <div className="mx-auto mt-9 w-full max-w-md">
    <div className="gold-ring flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-lg">
      <input aria-label="First name" autoComplete="given-name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Your first name…" className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[17px] text-[#3d0b26] outline-none" />
      <button onClick={submit} disabled={!ready} className={`btn-shine shrink-0 rounded-full px-6 py-3 text-[15px] font-semibold text-white ${ready ? '' : 'opacity-40'}`}>Begin →</button>
    </div>
    {resume && <button onClick={onStart} className="mt-4 text-[13px] font-medium text-[#751545] underline">Continue where I left off</button>}
  </div>;
}

const SNAPSHOT = [
  ['Your recurring loop', 'See the sequence that tends to repeat from attraction to uncertainty, conflict, or ending.'],
  ['Your strongest trigger', 'Identify the moment most likely to pull you into chasing, withdrawing, overthinking, or over-accommodating.'],
  ['Your blind spot', 'Get one concrete reflection about what your current dating strategy may be missing.'],
  ['Your next move', 'Leave with one practical action you can try immediately.'],
];
const PAID = [
  ['Personal Love Pattern Map', 'A deeper personalized reading of your recurring relationship pattern.'],
  ['Partner & Date Filter', 'Personalized green flags, red flags, and observable behaviors for evaluating compatibility earlier.'],
  ['Script Vault', 'Exact language for distance, inconsistency, boundaries, conflict, clarity, and commitment conversations.'],
  ['90-Day Practice Path', 'Structured practical experiments for changing how you respond and choose over time.'],
  ['Downloadable Deep Reading', 'Keep the full personalized reading privately for future reflection.'],
];
const FAQ = [
  ['Is the assessment free?', 'Yes. The assessment and Pattern Snapshot are free. After seeing your Snapshot, you can choose whether to purchase the deeper personalized program.'],
  ['Is Revela therapy or a diagnosis?', 'No. Revela is educational self-reflection and decision-support content, not medical or psychological advice, diagnosis, treatment, or a substitute for a licensed professional.'],
  ['Does Revela guarantee a relationship outcome?', 'No. No assessment can guarantee a partner, engagement, marriage, or other relationship outcome. Revela helps you reflect on patterns, communication, and decisions.'],
  ['Are my answers private?', 'Your answers are used to create your personalized experience and operate the service. They are not sold to advertisers. You can request deletion through our privacy or contact pages.'],
];

export default function Landing({ onStart, onStartWithName, resume = false, onRestart }: { onStart: () => void; onStartWithName: (name: string) => void; resume?: boolean; onRestart?: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sticky, setSticky] = useState(false);
  trpc.public.spotsLeft.useQuery(undefined, { refetchInterval: 8000, retry: false });
  useEffect(() => { const f = () => setSticky(window.scrollY > 160); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f); }, []);
  return <div className="bg-grain min-h-screen pb-24">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><div><span className="font-display text-2xl font-semibold text-[#3d0b26]">Revela</span><span className="ml-2 text-[10px] uppercase tracking-[.2em] text-[#c9a24b]">Love Patterns</span></div><a href="#how" className="text-sm text-[#751545]/70">How it works</a></div></header>
    <div aria-hidden={!sticky} className={`pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-4 transition-all ${sticky ? 'opacity-100' : 'translate-y-5 opacity-0'}`}><button onClick={onStart} tabIndex={sticky ? 0 : -1} className="btn-shine pointer-events-auto min-h-[54px] w-full max-w-sm rounded-full px-8 py-4 font-semibold text-white shadow-xl">{resume ? 'Continue My Assessment →' : 'Reveal My Pattern — Free →'}</button></div>

    <section className="flex min-h-[78vh] flex-col items-center justify-center px-6 pb-16 pt-32 text-center">
      <Reveal><p className="mb-6 inline-block rounded-full border border-[#c9a24b]/40 bg-white/70 px-5 py-2 text-[11px] font-semibold uppercase tracking-[.22em] text-[#751545]">Private relationship-pattern assessment</p></Reveal>
      <Reveal><h1 className="font-display max-w-4xl text-[2.7rem] font-medium leading-[1.05] text-[#3d0b26] md:text-6xl">Same relationship.<em className="block font-light text-[#751545]">Different person?</em></h1></Reveal>
      <Reveal><p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">See the pattern that may be shaping who you choose, what triggers you, and how you respond when closeness becomes uncertain.</p></Reveal>
      <Reveal className="w-full"><NameCapture onStartWithName={onStartWithName} resume={resume} onStart={onStart} /></Reveal>
      <p className="mt-5 text-[12.5px] text-[#751545]/55">Free Pattern Snapshot · no card required · educational, not diagnostic</p>
    </section>

    <section id="how" className="border-y border-[#751545]/10 bg-white/65 px-6 py-20"><div className="mx-auto max-w-5xl">
      <Reveal className="mx-auto max-w-3xl text-center"><p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#c9a24b]">How it works</p><h2 className="font-display mt-4 text-3xl font-medium text-[#3d0b26] md:text-5xl">See something useful before you decide to buy anything.</h2><p className="mt-5 text-[#4a1230]/70">Complete the assessment and receive a genuine Pattern Snapshot. If you want help going deeper, you can then choose the paid personalized program. No surprise paywall.</p></Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-3">{[['01','Answer honestly','Focused questions about relationship history, reactions, conflict, and what you want next.'],['02','See your Snapshot','Get your recurring loop, strongest trigger, blind spot, and one practical next move.'],['03','Choose what happens next','Keep the free insight, or unlock deeper personalized tools.']].map(([n,t,d]) => <div key={n} className="rounded-3xl border border-[#751545]/10 bg-[#fbf5ef] p-7"><span className="font-display text-2xl text-[#c9a24b]">{n}</span><h3 className="font-display mt-4 text-xl text-[#3d0b26]">{t}</h3><p className="mt-3 text-sm leading-relaxed text-[#4a1230]/70">{d}</p></div>)}</div>
    </div></section>

    <section className="mx-auto max-w-4xl px-6 py-24"><Reveal className="text-center"><p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#c4688a]">Your free Pattern Snapshot</p><h2 className="font-display mt-4 text-3xl font-medium text-[#3d0b26] md:text-5xl">Useful even if you never purchase.</h2></Reveal><div className="mt-10 grid gap-3 sm:grid-cols-2">{SNAPSHOT.map(([t,d]) => <div key={t} className="rounded-2xl border border-[#751545]/10 bg-white/80 p-6"><h3 className="font-semibold text-[#3d0b26]">✓ {t}</h3><p className="mt-2 text-sm leading-relaxed text-[#4a1230]/70">{d}</p></div>)}</div></section>

    <section className="bg-[#3d0b26] px-6 py-24 text-[#fbf5ef]"><div className="mx-auto max-w-4xl"><Reveal className="text-center"><p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#edc840]">Optional after your free result</p><h2 className="font-display mt-4 text-3xl font-medium md:text-5xl">The deeper product is for changing what you do next.</h2><p className="mx-auto mt-5 max-w-2xl text-[#fbf5ef]/70">The paid experience is not “more quiz results.” It turns your answers into practical tools for dates, boundaries, uncertainty, and recurring triggers.</p></Reveal><div className="mt-10 grid gap-3">{PAID.map(([t,d]) => <div key={t} className="rounded-2xl border border-white/10 bg-white/[.05] p-6"><h3 className="font-display text-lg text-[#edc840]">{t}</h3><p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p></div>)}</div><div className="mt-10 text-center"><button onClick={onStart} className="rounded-full bg-[#edc840] px-8 py-4 font-semibold text-[#3d0b26]">Get My Free Snapshot →</button></div></div></section>

    <section className="mx-auto max-w-3xl px-6 py-24"><Reveal className="text-center"><h2 className="font-display text-3xl font-medium text-[#3d0b26] md:text-5xl">Questions, answered clearly.</h2></Reveal><div className="mt-10 space-y-3">{FAQ.map(([q,a],i) => <div key={q} className="rounded-2xl border border-[#751545]/10 bg-white/75"><button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full justify-between gap-4 px-6 py-5 text-left font-semibold text-[#3d0b26]"><span>{q}</span><span>＋</span></button>{openFaq === i && <p className="px-6 pb-5 text-sm leading-relaxed text-[#4a1230]/70">{a}</p>}</div>)}</div><div className="mt-12 text-center"><button onClick={onStart} className="btn-shine rounded-full px-8 py-4 font-semibold text-white">{resume ? 'Continue My Assessment →' : 'Reveal My Pattern — Free →'}</button>{resume && onRestart && <button onClick={onRestart} className="ml-4 text-sm text-[#751545] underline">Start over</button>}</div></section>

    <footer className="border-t border-[#751545]/10 px-6 py-10 text-center"><p className="font-display text-xl font-semibold text-[#3d0b26]">Revela</p><div className="mt-4 flex flex-wrap justify-center gap-5 text-xs text-[#751545]/70"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund">Refunds</a><a href="/contact">Contact</a></div><p className="mx-auto mt-5 max-w-2xl text-[11.5px] leading-relaxed text-[#4a1230]/50">Revela provides educational self-reflection content informed by relationship research. It is not medical or psychological advice, diagnosis, treatment, or a guarantee of relationship outcomes.</p><p className="mt-3 text-[11px] text-[#4a1230]/40">© 2026 Revela · operated by Foorsa LLC · {SUPPORT_EMAIL}</p></footer>
  </div>;
}

import { useEffect, useRef, useState } from 'react';
import { SUPPORT_EMAIL, UNLOCK_PRICE } from '../lib/config';

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

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
    <div className="mx-auto mt-9 w-full max-w-md">
      <div className="gold-ring flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-lg shadow-[#751545]/5">
        <input
          aria-label="First name"
          autoComplete="given-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder="Your first name…"
          maxLength={120}
          className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[17px] text-[#3d0b26] outline-none placeholder:text-[#751545]/35"
        />
        <button
          onClick={submit}
          disabled={!ready}
          className={`btn-shine shrink-0 rounded-full px-6 py-3 text-[15px] font-semibold text-white ${ready ? '' : 'opacity-40'}`}
        >
          Begin →
        </button>
      </div>
      {resume && (
        <button onClick={onStart} className="mt-4 text-[13px] font-medium text-[#751545] underline underline-offset-4">
          Continue where I left off
        </button>
      )}
    </div>
  );
}

const FREE_SNAPSHOT = [
  ['Your recurring loop', 'See the sequence that tends to repeat from attraction to uncertainty, conflict, or ending.'],
  ['Your strongest trigger', 'Identify the moment most likely to pull you into chasing, withdrawing, overthinking, or over-accommodating.'],
  ['Your blind spot', 'Receive one concrete reflection about what your current dating strategy may be missing.'],
  ['Your next move', 'Leave with one practical behavior to try immediately.'],
];

const PAID_SYSTEM = [
  ['Personal Love Pattern Map', 'A deeper personalized reading of the choices, triggers, and protective strategies that shape your relationships.'],
  ['Partner & Date Filter', 'Observable green flags, red flags, and decision prompts for evaluating compatibility earlier.'],
  ['Personal Script Vault', 'Exact language for distance, inconsistency, boundaries, conflict, clarity, exclusivity, and ending ambiguity.'],
  ['Trigger Response Guide', 'A practical plan for the moments when you want to chase, withdraw, over-apologize, or send the emotional message.'],
  ['90-Day Practice Path', 'Structured experiments that turn insight into different behavior over time.'],
  ['Downloadable Deep Reading', 'A private, printable copy of your complete personalized reading.'],
];

const FAQ = [
  {
    question: 'Is the assessment really free?',
    answer: 'Yes. The 14-question assessment and your Pattern Snapshot are free. No card and no email are required to see the Snapshot. The deeper Secure Love Reset is optional and is shown only after your result.',
  },
  {
    question: 'Is Revela therapy or a psychological diagnosis?',
    answer: 'No. Revela is educational self-reflection and relationship decision-support content. It does not diagnose, treat, or replace a licensed mental-health professional.',
  },
  {
    question: 'Does Revela guarantee that I will find a partner or get married?',
    answer: 'No honest product can guarantee a relationship outcome. Revela helps you examine recurring patterns, communicate more clearly, and make more deliberate decisions.',
  },
  {
    question: 'What happens to my answers?',
    answer: 'They are used to create and operate your personalized experience. We do not sell individual answers to advertisers. You may request access or deletion through our Privacy and Contact pages.',
  },
];

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
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 180);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-grain min-h-screen pb-24">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a24b]">Love Patterns</span>
          </div>
          <a href="#how" className="text-sm font-medium text-[#751545]/65 transition hover:text-[#751545]">How it works</a>
        </div>
      </header>

      <div
        aria-hidden={!stickyVisible}
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 ${
          stickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      >
        <button
          onClick={onStart}
          tabIndex={stickyVisible ? 0 : -1}
          className="btn-shine pointer-events-auto min-h-[54px] w-full max-w-sm rounded-full px-8 py-4 font-semibold text-white shadow-[0_14px_40px_rgba(117,21,69,.3)]"
        >
          {resume ? 'Continue My Assessment →' : 'Reveal My Pattern — Free →'}
        </button>
      </div>

      <section className="flex min-h-[82vh] flex-col items-center justify-center px-6 pb-16 pt-32 text-center">
        <Reveal>
          <p className="mb-6 inline-block rounded-full border border-[#c9a24b]/40 bg-white/70 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#751545]">
            Private relationship-pattern assessment
          </p>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="font-display max-w-4xl text-[2.75rem] font-medium leading-[1.04] tracking-[-0.025em] text-[#3d0b26] md:text-6xl">
            Same relationship.
            <em className="block font-light text-[#751545]">Different person?</em>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#4a1230]/75 md:text-lg">
            See the pattern that may be shaping who you choose, what triggers you, and what you do when closeness becomes uncertain.
          </p>
        </Reveal>
        <Reveal delay={270} className="w-full">
          <NameCapture onStartWithName={onStartWithName} resume={resume} onStart={onStart} />
        </Reveal>
        <Reveal delay={360}>
          <p className="mt-5 text-[12.5px] text-[#751545]/55">
            14 focused questions · about 4 minutes · no card or email required for your Snapshot
          </p>
        </Reveal>
      </section>

      <section id="how" className="scroll-mt-24 border-y border-[#751545]/10 bg-white/65 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c9a24b]">How it works</p>
            <h2 className="font-display mt-4 text-3xl font-medium text-[#3d0b26] md:text-5xl">
              See something useful before deciding to buy anything.
            </h2>
            <p className="mt-5 leading-relaxed text-[#4a1230]/70">
              Revela gives you a genuine free Pattern Snapshot first. Afterward, you may keep the insight and leave, or choose the deeper personalized system. There is no surprise paywall.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Answer honestly', 'Focused questions about your relationship history, reactions, conflict, and what you want next.'],
              ['02', 'See your Snapshot', 'Receive your recurring loop, strongest trigger, blind spot, and one practical next move.'],
              ['03', 'Choose what happens next', 'Keep the free result, or unlock the tools designed to help you respond and choose differently.'],
            ].map(([number, title, description]) => (
              <Reveal key={number}>
                <div className="h-full rounded-3xl border border-[#751545]/10 bg-[#fbf5ef] p-7">
                  <span className="font-display text-2xl text-[#c9a24b]">{number}</span>
                  <h3 className="font-display mt-4 text-xl text-[#3d0b26]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4a1230]/70">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Your free Pattern Snapshot</p>
          <h2 className="font-display mt-4 text-3xl font-medium text-[#3d0b26] md:text-5xl">Useful even if you never purchase.</h2>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {FREE_SNAPSHOT.map(([title, description]) => (
            <Reveal key={title}>
              <div className="h-full rounded-2xl border border-[#751545]/10 bg-white/80 p-6">
                <h3 className="font-semibold text-[#3d0b26]">✓ {title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4a1230]/70">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#3d0b26] px-6 py-24 text-[#fbf5ef]">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">Optional after your free result</p>
            <h2 className="font-display mt-4 text-3xl font-medium md:text-5xl">
              The paid product is for changing what you do next.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-[#fbf5ef]/70">
              The Secure Love Reset is not “more quiz results.” It turns your answers into practical tools for dates, boundaries, uncertainty, conflict, and recurring triggers.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {PAID_SYSTEM.map(([title, description]) => (
              <Reveal key={title}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.05] p-6">
                  <h3 className="font-display text-lg text-[#edc840]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <p className="text-sm text-white/60">One payment of {UNLOCK_PRICE} · no subscription · 30-day guarantee</p>
            <button onClick={onStart} className="mt-5 rounded-full bg-[#edc840] px-8 py-4 font-semibold text-[#3d0b26] transition hover:scale-[1.01]">
              Get My Free Snapshot First →
            </button>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Clear answers</p>
          <h2 className="font-display mt-4 text-3xl font-medium text-[#3d0b26] md:text-5xl">Questions you should ask before trusting us.</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map((item, index) => (
            <Reveal key={item.question}>
              <div className="rounded-2xl border border-[#751545]/10 bg-white/75">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-[#3d0b26]"
                >
                  <span>{item.question}</span>
                  <span className={`transition-transform ${openFaq === index ? 'rotate-45' : ''}`}>＋</span>
                </button>
                {openFaq === index && <p className="px-6 pb-5 text-sm leading-relaxed text-[#4a1230]/70">{item.answer}</p>}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12 text-center">
          <button onClick={onStart} className="btn-shine rounded-full px-8 py-4 font-semibold text-white">
            {resume ? 'Continue My Assessment →' : 'Reveal My Pattern — Free →'}
          </button>
          {resume && onRestart && (
            <button onClick={onRestart} className="ml-4 text-sm text-[#751545] underline underline-offset-4">Start over</button>
          )}
        </Reveal>
      </section>

      <footer className="border-t border-[#751545]/10 px-6 py-10 text-center">
        <p className="font-display text-xl font-semibold text-[#3d0b26]">Revela</p>
        <div className="mt-4 flex flex-wrap justify-center gap-5 text-xs text-[#751545]/70">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/refund">Refunds</a>
          <a href="/contact">Contact</a>
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-[11.5px] leading-relaxed text-[#4a1230]/50">
          Revela provides educational self-reflection content informed by relationship research. It is not medical or psychological advice, diagnosis, treatment, or a guarantee of relationship outcomes.
        </p>
        <p className="mt-3 text-[11px] text-[#4a1230]/40">© 2026 Revela · operated by Foorsa LLC · {SUPPORT_EMAIL}</p>
      </footer>
    </div>
  );
}

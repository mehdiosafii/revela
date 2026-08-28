import React from 'react';
import {
  buildReport,
  scoreAnswers,
  type Answers,
  type Attachment,
  type Report as BuiltInReport,
} from '../lib/engine';
import { OFFER_NAME, SUPPORT_EMAIL, UNLOCK_PRICE } from '../lib/config';
import { fbTrack } from '../lib/fbpixel';
import { getToken } from '../lib/tracker';
import { trpc } from '@/providers/trpc';
import { Scene, ScenePhotoPrompt, useIllustrations } from './Illustrations';

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
  fieldGuide?: {
    scripts: { situation: string; sayThis: string; notThis: string }[];
    greenFlags: string[];
    redFlags: string[];
  } | null;
  closingLine: string;
}

type Notice = { tone: 'success' | 'warning' | 'error'; text: string } | null;

interface Props {
  answers: Answers;
  deep?: DeepReport | null;
  unlocked?: boolean;
  premiumGenerating?: boolean;
  notice?: Notice;
}

interface View {
  archetypeName: string;
  archetypeLine: string | null;
  headline: string;
  opening: string[];
  corePattern: string[];
  rootCause: string[];
  hiddenTruth: string[];
  herWords: string | null;
  herWordsReflected: string[];
  manSheNeeds: string[];
  path: { title: string; text: string }[];
  closingLine: string | null;
}

const paragraphs = (value: unknown): string[] =>
  typeof value === 'string'
    ? value.split(/\n+/).map((item) => item.trim()).filter(Boolean)
    : Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

function toView(report: BuiltInReport, deep: DeepReport | null, answers: Answers): View {
  if (deep) {
    return {
      archetypeName: deep.archetype || report.styleName,
      archetypeLine: deep.archetypeLine || null,
      headline: deep.headline || report.headline,
      opening: paragraphs(deep.openingLetter),
      corePattern: paragraphs(deep.corePattern),
      rootCause: paragraphs(deep.rootCause),
      hiddenTruth: paragraphs(deep.hiddenTruth),
      herWords: report.herWords,
      herWordsReflected: paragraphs(deep.herWordsReflected),
      manSheNeeds: Array.isArray(deep.manSheNeeds) ? deep.manSheNeeds : report.manSheNeeds,
      path: Array.isArray(deep.ninetyDayPath) && deep.ninetyDayPath.length ? deep.ninetyDayPath : report.path,
      closingLine: deep.closingLine || null,
    };
  }

  const snapshot = snapshotFor(report.style, answers);
  const headlines: Record<Attachment, string> = {
    anxious: 'More effort is not always more safety.',
    avoidant: 'Protection can quietly become distance.',
    fearful: 'Intensity and emotional safety are not the same thing.',
    secure: 'Caution deserves examination too.',
  };
  const childhoodDetails = [
    answers.home_climate && `your home felt “${answers.home_climate}”`,
    answers.father_figure && `your father or father figure was “${answers.father_figure}”`,
    answers.child_comfort && `when you needed comfort, “${answers.child_comfort}”`,
  ].filter(Boolean).join('; ');

  return {
    archetypeName: report.styleName,
    archetypeLine: 'A practical pattern hypothesis based on the responses you selected—not a diagnosis or identity.',
    headline: headlines[report.style],
    opening: [
      `Your answers suggest that the important moment is not only who you meet, but what you do when certainty changes. ${snapshot.loop[0]} ${snapshot.loop[1]}`,
      'That response may have protected you before. The purpose of this Reset is not to judge it; it is to help you notice it early enough to choose deliberately.',
    ],
    corePattern: snapshot.loop,
    rootCause: [
      childhoodDetails
        ? `You shared that ${childhoodDetails}. Those experiences may influence what feels familiar or safe now, but this is a possible connection rather than a statement of fact. The useful question is whether the old response still serves the relationship you want today.`
        : 'People often learn protective relationship responses from repeated experiences, but your answers do not establish one single cause. Focus on the present-day trigger and the response you can observe and change.',
    ],
    hiddenTruth: [
      snapshot.blindSpot,
      'A blind spot is not a character flaw. Once it becomes observable, you can slow the moment down, ask for clearer information, and choose from evidence instead of urgency or protection.',
    ],
    herWords: report.herWords,
    herWordsReflected: [],
    manSheNeeds: [
      'Someone whose interest is visible in consistent plans and follow-through, so you do not have to interpret occasional intensity as commitment.',
      'Someone who answers direct questions directly and can name what he wants without keeping the connection useful only when it suits him.',
      'Someone who respects your pace and boundaries without punishing you with withdrawal, pressure, mockery, or sudden coldness.',
      'Someone who stays respectful during disagreement, returns to unresolved conversations, and treats repair as a shared responsibility.',
    ],
    path: [
      { title: 'Weeks 1–2 · Notice Before Acting', text: `Track the first physical and emotional signs of your trigger. Before reacting, wait until the intensity drops and use this sentence once: ${snapshot.script}` },
      { title: 'Weeks 3–6 · Evaluate Observable Behavior', text: 'After each meaningful interaction, write down what was promised, what actually happened, and how you felt afterward. A green flag is consistent follow-through; a red flag is clarity appearing only when you begin to leave.' },
      { title: 'Weeks 7–12 · Practice Clear Selection', text: 'Name what you are looking for, ask what the other person is genuinely available for, and compare the answer with behavior over time. Continue when words and actions align; slow down or leave when ambiguity becomes the repeated structure.' },
    ],
    closingLine: 'The goal is not to become fearless. It is to make the next choice with more information than the last one.',
  };
}

function emphasis(text: unknown): React.ReactNode {
  const parts = (typeof text === 'string' ? text : '').split(/\*([^*]+)\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? <em key={index}>{part}</em> : <React.Fragment key={index}>{part}</React.Fragment>,
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const classes = {
    success: 'border-[#2f7d57]/20 bg-[#edf8f1] text-[#245f43]',
    warning: 'border-[#a77a1f]/20 bg-[#fff8e7] text-[#725514]',
    error: 'border-[#a83d3d]/20 bg-[#fff0f0] text-[#7a2d2d]',
  }[notice.tone];
  return <div className={`mx-auto mb-8 max-w-3xl rounded-2xl border px-5 py-4 text-center text-sm leading-relaxed ${classes}`}>{notice.text}</div>;
}

function snapshotFor(style: Attachment, answers: Answers) {
  const response = answers.he_pulls_away || 'your usual response when communication changes';
  const conflict = answers.conflict_style || 'your usual conflict response';
  const exPattern = answers.exes_pattern || 'the pattern across previous partners';

  const base = {
    anxious: {
      loop: [
        `Intensity or inconsistency creates urgency, especially when ${exPattern.toLowerCase()}.`,
        `When closeness changes, your instinct becomes “${response},” so uncertainty receives more energy than consistency.`,
        'You may invest before enough evidence exists, then experience the loss as proof that you cared too much.',
      ],
      trigger: 'A noticeable change in attention, texting, warmth, or certainty after you have started to hope.',
      blindSpot: 'The effort you use to preserve a connection can prevent you from evaluating whether the connection is preserving you.',
      nextMove: 'When communication changes, wait until your body is calm. Then ask one direct question once—without sending a second message to manage the answer.',
      script: '“I noticed the communication changed. I value consistency, so I wanted to ask directly whether you still want to continue getting to know each other.”',
    },
    avoidant: {
      loop: [
        'You feel safest while interest remains possible but not yet demanding.',
        `When closeness asks something of you, your instinct becomes “${response},” and distance restores a sense of control.`,
        `During conflict, “${conflict}” can make a solvable moment feel like evidence that the entire relationship is wrong.`,
      ],
      trigger: 'A partner needing reassurance, naming a feeling, or asking for greater clarity and consistency.',
      blindSpot: 'A calm, available person can feel less compelling precisely because your nervous system has nothing to solve or escape.',
      nextMove: 'Before ending or withdrawing, name one specific concern and allow the other person one real opportunity to respond.',
      script: '“Part of me wants to pull away right now. I would rather tell you what felt difficult and see whether we can understand it together.”',
    },
    fearful: {
      loop: [
        'Strong chemistry creates rapid closeness, but closeness also raises the cost of being hurt.',
        `When the emotional weather changes, “${response}” becomes a protection strategy rather than a deliberate choice.`,
        `Conflict can activate “${conflict},” creating the very instability your protective side was trying to prevent.`,
      ],
      trigger: 'Mixed signals: enough warmth to create hope, followed by enough distance to create fear.',
      blindSpot: 'Intensity can feel like evidence of importance even when it is actually evidence of unpredictability.',
      nextMove: 'Slow the pace after a strong emotional spike. Make no major relationship decision while activated; return to observable behavior the next day.',
      script: '“I care about this, and I am too activated to discuss it well tonight. I want to return to it tomorrow when I can be clear instead of reactive.”',
    },
    secure: {
      loop: [
        'You can communicate and care well, but caution may quietly dominate selection.',
        'You may dismiss a steady connection before curiosity has enough time to become attraction.',
        'The result is not chaos—it is a series of reasonable exits that may protect you from discovering what could deepen slowly.',
      ],
      trigger: 'A promising person who feels calm but does not produce immediate certainty or dramatic chemistry.',
      blindSpot: 'Discernment and premature disqualification can sound almost identical in your own head.',
      nextMove: 'When there is respect, attraction, and emotional availability—but no instant fireworks—allow three dates before making a final judgment.',
      script: '“I am interested in getting to know you, and I prefer letting something real unfold instead of forcing instant certainty.”',
    },
  } as const;

  return base[style];
}

function Section({
  eyebrow,
  title,
  children,
  className = '',
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`print-block mx-auto max-w-3xl px-6 pt-16 md:px-0 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c4688a]">{eyebrow}</p>
      <h2 className="font-display mt-3 text-2xl font-medium text-[#3d0b26] md:text-3xl">{title}</h2>
      <div className="mt-3 h-px bg-gradient-to-r from-[#c9a24b]/50 via-[#751545]/15 to-transparent" />
      <div className="mt-7 space-y-4">{children}</div>
    </section>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((paragraph, index) => (
        <p key={index} className="text-[15.5px] leading-[1.85] text-[#4a1230]/85">{emphasis(paragraph)}</p>
      ))}
    </>
  );
}

function CheckoutButton({ className = '' }: { className?: string }) {
  const checkout = trpc.checkout.create.useMutation();

  const startCheckout = () => {
    fbTrack('InitiateCheckout', { value: 29, currency: 'USD' });
    checkout.mutate(
      { token: getToken() },
      {
        onSuccess: (result) => window.location.assign(result.url),
      },
    );
  };

  return (
    <div className={className}>
      <button
        onClick={startCheckout}
        disabled={checkout.isPending}
        className={`btn-shine inline-flex min-h-[56px] items-center justify-center rounded-full px-8 py-4 text-[15px] font-semibold text-white transition-opacity ${checkout.isPending ? 'cursor-wait opacity-60' : ''}`}
      >
        {checkout.isPending ? 'Opening secure checkout…' : `Start My Secure Love Reset — ${UNLOCK_PRICE}`}
      </button>
      <p className="mt-3 text-[12px] text-[#751545]/55">One payment · immediate access · no subscription · 30-day guarantee</p>
      {checkout.error && (
        <p role="alert" className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed text-[#9c2b2b]">
          Secure checkout could not be opened. Please refresh and try again, or contact {SUPPORT_EMAIL}.
        </p>
      )}
    </div>
  );
}

function PatternScore({ answers }: { answers: Answers }) {
  const { scores } = scoreAnswers(answers);
  const labels: Record<Attachment, string> = {
    anxious: 'Pursuit',
    avoidant: 'Protection',
    fearful: 'Push–pull',
    secure: 'Steady connection',
  };
  const scoreValues = Object.values(scores) as number[];
  const maximum = Math.max(1, ...scoreValues);

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {(Object.keys(scores) as Attachment[]).map((key) => (
        <div key={key} className="rounded-2xl border border-[#751545]/10 bg-white/75 px-5 py-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-[#3d0b26]">{labels[key]}</span>
            <span className="tabular-nums text-[#751545]/50">{scores[key]}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#751545]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#751545] to-[#c4688a]" style={{ width: `${Math.round((scores[key] / maximum) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FreeSnapshot({ answers, notice }: { answers: Answers; notice: Notice }) {
  const report = buildReport(answers);
  const snapshot = snapshotFor(report.style, answers);
  const safeHeadline: Record<Attachment, string> = {
    anxious: 'More effort is not always more safety.',
    avoidant: 'Protection can quietly become distance.',
    fearful: 'Intensity and emotional safety are not the same thing.',
    secure: 'Caution deserves examination too.',
  };

  return (
    <div className="bg-grain min-h-screen pb-24">
      <header className="border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a24b]">Pattern Snapshot</span>
          </div>
          <span className="rounded-full bg-[#2f7d57]/10 px-3 py-1 text-[11px] font-semibold text-[#2f7d57]">Free result ✓</span>
        </div>
      </header>

      <main className="px-5 pb-10 pt-12 sm:px-6">
        <NoticeBanner notice={notice} />
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Prepared for {report.name}</p>
          <h1 className="font-display mt-5 text-4xl font-medium leading-tight text-[#3d0b26] md:text-5xl">Your Pattern Snapshot</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[#4a1230]/68">
            This is an educational reflection based on your answers—not a diagnosis, prediction, or final verdict about you.
          </p>

          <div className="gold-ring mx-auto mt-10 rounded-[2rem] bg-white/85 p-8 text-left shadow-[0_28px_80px_-55px_rgba(61,11,38,.55)] sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a24b]">Your strongest pattern</p>
            <h2 className="font-display mt-3 text-3xl font-medium text-[#751545]">{report.styleName}</h2>
            <p className="font-display mt-5 text-xl font-light italic leading-relaxed text-[#3d0b26]">“{safeHeadline[report.style]}”</p>
            <p className="mt-6 text-[15px] leading-[1.75] text-[#4a1230]/78">{snapshot.loop[0]} {snapshot.loop[1]}</p>
            <PatternScore answers={answers} />
          </div>
        </section>

        <Section eyebrow="01 · The recurring loop" title="What may be repeating">
          <ol className="space-y-3">
            {snapshot.loop.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-2xl border border-[#751545]/10 bg-white/75 p-5 text-[15px] leading-relaxed text-[#4a1230]/82">
                <span className="font-display text-lg text-[#c9a24b]">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section eyebrow="02 · Your strongest trigger" title="The moment the pattern tends to take over">
          <div className="rounded-2xl bg-[#3d0b26] p-7 text-[#fbf5ef]">
            <p className="font-display text-xl font-light italic leading-relaxed">{snapshot.trigger}</p>
          </div>
        </Section>

        <Section eyebrow="03 · Your blind spot" title="The useful part that is hard to see from inside it">
          <p className="rounded-2xl border border-[#c9a24b]/30 bg-[#fffaf0] p-6 text-[16px] leading-[1.8] text-[#4a1230]/88">{snapshot.blindSpot}</p>
        </Section>

        <Section eyebrow="04 · Try this today" title="One practical pattern interrupt">
          <p className="text-[15.5px] leading-[1.85] text-[#4a1230]/85">{snapshot.nextMove}</p>
          <div className="rounded-2xl border border-[#2f7d57]/20 bg-[#edf8f1] p-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#2f7d57]">Words you can borrow</p>
            <p className="font-display mt-3 text-lg font-light italic leading-relaxed text-[#245f43]">“{snapshot.script}”</p>
          </div>
        </Section>

        <section className="mx-auto mt-20 max-w-4xl rounded-[2.25rem] bg-[#3d0b26] px-6 py-12 text-center text-[#fbf5ef] sm:px-10 sm:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#edc840]">Your Snapshot names the loop</p>
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-medium leading-tight md:text-4xl">
            The Secure Love Reset helps you change what happens next.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/68">
            Built from your answers for the moments that matter: the next text, the next date, the next boundary, the next conflict, and the next decision about whether to continue, clarify, slow down, or leave.
          </p>

          <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
            {[
              ['Personal Love Pattern Map', 'A deeper explanation of your attraction loop, protection strategy, and recurring sequence.'],
              ['Partner & Date Filter', 'Personalized green flags, red flags, and observable behaviors—not vague “trust your gut” advice.'],
              ['Personal Script Vault', 'Exact words for inconsistency, boundaries, conflict, exclusivity, and ending ambiguity.'],
              ['Trigger Response Guide', 'What to do before chasing, withdrawing, over-apologizing, or sending the emotional message.'],
              ['90-Day Practice Path', 'A staged plan that turns awareness into different choices and responses.'],
              ['Downloadable Deep Reading', 'Your complete private reading to save, print, and revisit.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <h3 className="font-display text-lg text-[#edc840]">{title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{description}</p>
              </div>
            ))}
          </div>

          <CheckoutButton className="mt-10" />
        </section>

        <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#c9a24b]/35 bg-white/80 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c9a24b]/20 text-xl">✓</span>
            <div>
              <h3 className="font-display text-lg font-medium text-[#3d0b26]">30-day money-back guarantee</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#4a1230]/72">
                Open the product and use the first tools. If the experience feels generic or unusable, email {SUPPORT_EMAIL} within 30 days for a full refund.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#751545]/10 px-6 py-8 text-center text-[11px] leading-relaxed text-[#4a1230]/45">
        © 2026 Revela · operated by Foorsa LLC · educational self-reflection, not medical or psychological advice
      </footer>
    </div>
  );
}

function FullReport({ answers, deep, premiumGenerating, notice }: { answers: Answers; deep: DeepReport | null; premiumGenerating: boolean; notice: Notice }) {
  const builtIn = buildReport(answers);
  const view = toView(builtIn, deep, answers);
  const snapshot = snapshotFor(builtIn.style, answers);
  const illustrations = useIllustrations(answers);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const download = () => window.print();

  return (
    <div className="bg-grain min-h-screen pb-16">
      <header className="no-print sticky top-0 z-50 border-b border-[#751545]/10 bg-[#fbf5ef]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-[#3d0b26]">Revela</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a24b]">Secure Love Reset</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#2f7d57]/10 px-3 py-1 text-[11px] font-semibold text-[#2f7d57]">Unlocked ✓</span>
            <button onClick={download} className="btn-shine rounded-full px-5 py-2.5 text-[13px] font-semibold text-white">Save as PDF</button>
          </div>
        </div>
      </header>

      <main className="px-5 pb-12 pt-10 sm:px-6">
        <NoticeBanner notice={notice} />
        {premiumGenerating && (
          <div className="no-print mx-auto mb-8 max-w-3xl rounded-2xl border border-[#c9a24b]/25 bg-[#fffaf0] px-5 py-4 text-center text-sm leading-relaxed text-[#725514]">
            Your tools are ready. The deeper narrative is still being personalized and will appear here automatically when complete.
          </div>
        )}

        <section className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4688a]">Prepared exclusively for</p>
          <h1 className="font-display mt-4 text-4xl font-medium text-[#3d0b26] md:text-5xl">{builtIn.name}</h1>
          <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-[#751545]/48">{today} · private personalized edition</p>

          <div className="gold-ring mx-auto mt-10 rounded-[2rem] bg-white/85 p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a24b]">Your pattern map</p>
            <h2 className="font-display mt-3 text-3xl font-medium text-[#751545]">{view.archetypeName}</h2>
            {view.archetypeLine && <p className="mt-2 text-[14px] italic text-[#4a1230]/60">{view.archetypeLine}</p>}
            <p className="font-display mt-5 text-xl font-light italic leading-relaxed text-[#3d0b26]">“{view.headline}”</p>
          </div>
        </section>

        <Section eyebrow="Start here" title="Your first pattern interrupt">
          <div className="rounded-2xl border border-[#2f7d57]/20 bg-[#edf8f1] p-6">
            <p className="text-[15.5px] leading-[1.8] text-[#245f43]">{snapshot.nextMove}</p>
            <p className="font-display mt-4 text-lg font-light italic leading-relaxed text-[#245f43]">“{snapshot.script}”</p>
          </div>
        </Section>

        <Section eyebrow="Reading I" title="The thread running through your answers">
          <Paragraphs items={view.opening} />
        </Section>

        <ScenePhotoPrompt state={illustrations} name={answers.name} />

        <Section eyebrow="Reading II" title="The loop you keep running">
          <Paragraphs items={view.corePattern} />
          <ol className="mt-6 space-y-3">
            {snapshot.loop.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-2xl border border-[#751545]/10 bg-white/75 p-5 text-[15px] leading-relaxed text-[#4a1230]/82">
                <span className="font-display text-lg text-[#c9a24b]">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Scene id="parents" state={illustrations} />

        <Section eyebrow="Reading III" title="Where the protection may have started">
          <Paragraphs items={view.rootCause} />
        </Section>

        <Section eyebrow="Reading IV" title="The blind spot said plainly">
          <Paragraphs items={view.hiddenTruth} />
          {view.herWords && (
            <div className="mt-7 rounded-[1.75rem] bg-[#3d0b26] p-8 text-center text-[#fbf5ef]">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#c9a24b]">You told us</p>
              <p className="font-display mt-4 text-xl font-light italic leading-relaxed">“{view.herWords}”</p>
              {view.herWordsReflected.length > 0 && (
                <div className="mt-5 space-y-3 text-[14px] leading-relaxed text-white/72">
                  {view.herWordsReflected.map((item, index) => <p key={index}>{item}</p>)}
                </div>
              )}
            </div>
          )}
        </Section>

        <Scene id="peace" state={illustrations} />

        <Section eyebrow="Decision tool" title="Your partner and date filter">
          <p className="text-[15px] leading-relaxed text-[#4a1230]/75">
            Use this section to evaluate observable behavior. It is not a scorecard for perfection; it is a reminder not to let chemistry erase evidence.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#2f7d57]/20 bg-[#edf8f1] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f7d57]">Green flags for your pattern</p>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#245f43]">
                {(deep?.fieldGuide?.greenFlags?.length ? deep.fieldGuide.greenFlags : view.manSheNeeds).slice(0, 4).map((item, index) => (
                  <li key={index} className="flex gap-2"><span>✓</span><span>{emphasis(item)}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#9c2b2b]/20 bg-[#fff2f2] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c2b2b]">Pause and investigate</p>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#6f3030]">
                {(deep?.fieldGuide?.redFlags?.length
                  ? deep.fieldGuide.redFlags
                  : [
                      answers.exes_pattern || 'The same pattern you recognized across previous partners.',
                      'Words and future promises consistently exceed observable effort.',
                      'Clarity appears only when you begin to leave.',
                      'Your boundaries are treated as obstacles rather than useful information.',
                    ]
                ).slice(0, 4).map((item, index) => (
                  <li key={index} className="flex gap-2"><span>×</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section eyebrow="Communication tool" title="Your personal script vault">
          {deep?.fieldGuide?.scripts?.length ? (
            deep.fieldGuide.scripts.map((script, index) => (
              <div key={index} className="rounded-2xl border border-[#751545]/10 bg-white/80 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4688a]">{script.situation}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3d0b26]"><strong className="text-[#2f7d57]">Say:</strong> “{script.sayThis}”</p>
                {script.notThis && <p className="mt-2 text-[14px] leading-relaxed text-[#4a1230]/68"><strong className="text-[#9c2b2b]">Avoid:</strong> {script.notThis}</p>}
              </div>
            ))
          ) : (
            <>
              <div className="rounded-2xl border border-[#751545]/10 bg-white/80 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4688a]">When communication changes</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3d0b26]">“{snapshot.script}”</p>
              </div>
              <div className="rounded-2xl border border-[#751545]/10 bg-white/80 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4688a]">When you need clarity</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3d0b26]">“I enjoy this connection, and I am looking for something intentional. What are you genuinely available for right now?”</p>
              </div>
              <div className="rounded-2xl border border-[#751545]/10 bg-white/80 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4688a]">When ambiguity continues</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3d0b26]">“I do not need a rushed promise, but I do need consistency and direction. This no longer works for me, so I am stepping back.”</p>
              </div>
            </>
          )}
        </Section>

        <Section eyebrow="Implementation" title="Your 90-day practice path">
          {view.path.map((phase, index) => (
            <div key={`${phase.title}-${index}`} className="rounded-2xl border border-[#751545]/10 bg-white/80 px-6 py-5">
              <p className="font-display text-[17px] font-medium text-[#751545]">{phase.title}</p>
              <p className="mt-2 text-[15px] leading-[1.8] text-[#4a1230]/85">{emphasis(phase.text)}</p>
            </div>
          ))}
        </Section>

        <Scene id="children" state={illustrations} />

        {view.closingLine && (
          <section className="mx-auto max-w-2xl px-6 pb-6 pt-16 text-center">
            <div className="mx-auto h-px w-16 bg-[#c9a24b]/50" />
            <p className="font-display mt-8 text-2xl font-light italic leading-relaxed text-[#3d0b26]">“{view.closingLine}”</p>
          </section>
        )}

        <Scene id="clarity" state={illustrations} />

        <section className="no-print mx-auto mt-16 max-w-3xl rounded-3xl border border-[#c9a24b]/35 bg-white/85 p-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c4688a]">Keep this useful</p>
          <h2 className="font-display mt-3 text-2xl font-medium text-[#3d0b26]">Save it before the next emotional moment.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4a1230]/70">
            Re-read the Script Vault before sending a difficult message, and use the Date Filter before explaining away early inconsistency.
          </p>
          <button onClick={download} className="btn-shine mt-6 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white">Download My Reset as PDF</button>
          <p className="mt-4 text-[12px] text-[#751545]/50">Questions or something did not land? Email {SUPPORT_EMAIL}.</p>
        </section>

        <section className="print-block mx-auto mt-12 max-w-3xl rounded-2xl border border-[#751545]/10 bg-white/60 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#751545]/55">Important context</p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#4a1230]/60">
            {OFFER_NAME} is educational self-reflection and decision-support content informed by relationship and attachment research. It is not medical or psychological advice, a diagnosis, treatment, therapy, or a guarantee of a relationship outcome.
          </p>
        </section>
      </main>

      <footer className="mt-12 border-t border-[#751545]/10 px-6 py-8 text-center text-[11px] text-[#4a1230]/45">
        © 2026 Revela · operated by Foorsa LLC · private educational content
      </footer>
    </div>
  );
}

export default function Report({
  answers,
  deep = null,
  unlocked = false,
  premiumGenerating = false,
  notice = null,
}: Props) {
  if (!unlocked) return <FreeSnapshot answers={answers} notice={notice} />;
  return <FullReport answers={answers} deep={deep} premiumGenerating={premiumGenerating} notice={notice} />;
}

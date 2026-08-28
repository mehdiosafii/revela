import { useMemo, useState } from 'react';
import { scoreAnswers, type Answers, type Attachment } from '../lib/engine';
import { getToken } from '../lib/tracker';

type Tab = 'today' | 'sos' | 'dates' | 'scripts' | 'map';
type DateDecision = 'Continue' | 'Clarify' | 'Slow Down' | 'Exit';

type DateScores = {
  consistency: number;
  clarity: number;
  respect: number;
  followThrough: number;
  emotionalAvailability: number;
};

type DateEntry = {
  id: string;
  createdAt: string;
  person: string;
  notes: string;
  scores: DateScores;
  decision: DateDecision;
  reason: string;
};

const STYLE_LABELS: Record<Attachment, string> = {
  anxious: 'Pursuit pattern',
  avoidant: 'Protection pattern',
  fearful: 'Push–pull pattern',
  secure: 'Cautious selection pattern',
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '◷' },
  { id: 'sos', label: 'SOS', icon: '✦' },
  { id: 'dates', label: 'Dates', icon: '◇' },
  { id: 'scripts', label: 'Scripts', icon: '“”' },
  { id: 'map', label: 'My Map', icon: '◎' },
];

const DEFAULT_SCORES: DateScores = {
  consistency: 3,
  clarity: 3,
  respect: 3,
  followThrough: 3,
  emotionalAvailability: 3,
};

function safeJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uniqueId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function copyText(text: string, onCopied: () => void) {
  navigator.clipboard?.writeText(text).then(onCopied).catch(() => undefined);
}

function dailyActions(style: Attachment, answers: Answers): string[] {
  const patternSpecific: Record<Attachment, string[]> = {
    anxious: [
      'Notice one moment when uncertainty makes you want to increase effort. Write down the urge before acting on it.',
      'Send no second message today to manage someone else’s response. Let one clear message stand on its own.',
      'List three examples of consistent behavior you have previously overlooked because they did not feel intense.',
      'Choose one area of your day that does not depend on romantic attention and protect it on your calendar.',
      'When you feel the urge to explain more, ask: “What new information would this extra message actually add?”',
      'Write the difference between being wanted, being chosen, and being treated consistently.',
      'Review one past connection and mark the first moment words and behavior stopped matching.',
      'Practice receiving: accept one compliment, favor, or kind gesture without minimizing it or immediately returning it.',
      'Wait twenty minutes after an emotional trigger before opening the message thread again.',
      'Write one standard you will not lower simply because you are afraid the connection will end.',
    ],
    avoidant: [
      'Notice one moment when closeness makes you want to create distance. Name the specific fear underneath the impulse.',
      'Share one small preference today instead of saying “anything is fine.”',
      'Before deciding someone is wrong for you, separate one concrete incompatibility from one feeling of vulnerability.',
      'Tell one trusted person what you actually need instead of presenting only the self-sufficient version of you.',
      'If you feel crowded, ask for a defined amount of space rather than disappearing without explanation.',
      'Write one example of a safe person being patient with you. Let safety count as evidence, not boredom.',
      'Stay in one mildly uncomfortable conversation for five minutes longer than your usual exit point.',
      'Name one standard that protects your values and one “standard” that may protect you from being known.',
      'Offer one honest sentence about how something affected you without turning it into a joke or analysis.',
      'Review a past exit and ask whether you communicated the concern before deciding it could not be repaired.',
    ],
    fearful: [
      'Name today’s emotional intensity from 1–10. Make no major relationship decision above a 6.',
      'Write two columns: “what happened” and “what I fear it means.” Keep facts and predictions separate.',
      'Choose one regulating action—walk, shower, breath, or voice note—before replying while activated.',
      'Notice whether today’s attraction is growing from compatibility or from uncertainty and pursuit.',
      'Practice a both/and sentence: “I care about this, and I need time before responding.”',
      'Identify one push behavior and one pull behavior you use. Write the need each behavior is trying to protect.',
      'Re-read a difficult message once, not ten times. Respond only to what was actually said.',
      'Choose one boundary that reduces chaos without punishing the other person.',
      'Write what steady interest would look like over seven ordinary days—not one dramatic night.',
      'If you want to end something suddenly, wait until tomorrow and write the reason in one calm paragraph first.',
    ],
    secure: [
      'Notice one promising person or possibility you may be evaluating too quickly. Write what more time could reveal.',
      'Separate “not my person” from “not instantly certain.” They are not the same conclusion.',
      'List three qualities that become visible slowly rather than on a first date.',
      'Choose curiosity over evaluation in one conversation today. Ask a follow-up instead of scoring the answer.',
      'Review one past reasonable exit and ask whether fear of wasting time accelerated the decision.',
      'Write what healthy attraction feels like when it is calm, gradual, and still genuinely present.',
      'Allow one imperfect but respectful interaction to be repaired instead of treating it as final evidence.',
      'Name one non-negotiable and one preference. Do not let preferences disguise themselves as values.',
      'Stay open to a second or third date when respect, attraction, and availability are present—even without fireworks.',
      'Write one way you can communicate interest clearly without surrendering discernment.',
    ],
  };

  const universal = [
    `Review your answer about previous partners: “${answers.exes_pattern || 'the pattern across previous partners'}.” Write one observable early sign you will notice sooner next time.`,
    'Choose one green flag that can be observed in behavior and one red flag that cannot be explained away by potential.',
    'Write the exact sentence you will use the next time you need clarity. Keep it under twenty-five words.',
    'After your next meaningful interaction, record what was promised and what actually happened.',
    'Define the pace that allows both attraction and evidence to grow. Faster is not automatically more honest.',
    'Notice how your body feels after contact: settled, expanded, confused, depleted, or activated. Treat it as information, not a verdict.',
    'Write one relationship decision you are allowed to postpone until you have more information.',
    'Choose one person whose consistency you trust. List the behaviors that created that trust.',
    'Identify one story you tell yourself when someone becomes distant. Replace it with one neutral possibility.',
    'Write your minimum standard for communication during conflict in one sentence.',
    'Practice saying “I need time to think” before giving an answer you may later resent.',
    'List three signs that you are choosing the real person rather than the future version you imagine.',
    'Write one boundary as information about your participation—not a punishment designed to change someone.',
    'Review your last difficult interaction and identify the first moment you stopped responding deliberately.',
    'Choose one action today that strengthens the life a healthy relationship would need to join.',
    'Write the difference between chemistry, compatibility, availability, and commitment in your own words.',
    'Name one behavior you will stop interpreting and start asking about directly.',
    'Decide what repeated ambiguity will cost access to you: time, emotional intimacy, exclusivity, or continuation.',
    'Write one compassionate sentence to the part of you that learned this pattern for protection.',
    'Mark your progress: what do you now notice earlier than you did on day one?',
  ];

  return [...patternSpecific[style], ...universal];
}

function sosContent(style: Attachment, trigger: string, answers: Answers) {
  const directScripts: Record<string, string> = {
    distance: '“I noticed the communication changed. I value consistency, so I wanted to ask directly whether you still want to continue getting to know each other.”',
    text: '“I have said what I need to say. I am going to let this message stand and give both of us room to respond honestly.”',
    conflict: '“I care about resolving this, and I want to continue when we can both speak respectfully. I will return to it tomorrow.”',
    withdraw: '“Part of me wants to disappear right now. I need some time, and I will check back in by tomorrow evening.”',
    overthink: '“I do not have enough information to turn this fear into a conclusion. I can ask once or wait for behavior to clarify it.”',
  };
  const styleReminders: Record<Attachment, string> = {
    anxious: 'Your pattern may treat silence as an emergency. It is uncomfortable, but it is not automatically evidence of rejection.',
    avoidant: 'Your pattern may treat need or conflict as loss of freedom. A defined pause protects autonomy without destroying connection.',
    fearful: 'Your pattern may move rapidly between pursuit and escape. No major decision is required while your nervous system is activated.',
    secure: 'Your pattern may turn uncertainty into premature evaluation. More information can be gathered without abandoning your standards.',
  };

  return {
    reminder: styleReminders[style],
    steps: [
      'Pause the behavior for ten minutes. Put the phone down, change rooms, and let the physical intensity drop.',
      `Separate fact from story. Fact: “${trigger === 'distance' ? 'communication changed' : trigger === 'conflict' ? 'we had a difficult interaction' : 'I feel activated'}.” Story: the meaning your fear is adding.`,
      'Choose one clean action: ask once, request a defined pause, or wait for observable behavior. Do not combine all three.',
    ],
    script: directScripts[trigger] || directScripts.overthink,
    avoid:
      style === 'anxious'
        ? `Avoid repeating the response you selected in the assessment—“${answers.he_pulls_away || 'moving closer to manage the distance'}”—before you have new information.`
        : style === 'avoidant'
          ? 'Avoid making the other person guess whether your silence means a pause, punishment, or ending.'
          : style === 'fearful'
            ? 'Avoid sending a final message while also hoping the other person will stop you from leaving.'
            : 'Avoid converting one uncertain moment into a final compatibility decision before asking a direct question.',
  };
}

function evaluateDate(scores: DateScores): { decision: DateDecision; reason: string } {
  const values = Object.values(scores);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const minimum = Math.min(...values);

  if (scores.respect <= 2 || scores.clarity <= 1) {
    return {
      decision: 'Exit',
      reason: 'Respect or basic clarity is too low to justify deeper emotional investment. This is a decision prompt, not a diagnosis of the person.',
    };
  }
  if (average >= 4 && minimum >= 3) {
    return {
      decision: 'Continue',
      reason: 'The observable behavior is broadly consistent, clear, respectful, and available enough to gather more evidence without rushing commitment.',
    };
  }
  if (average >= 3 && minimum >= 2) {
    return {
      decision: 'Clarify',
      reason: 'There is enough positive evidence to ask a direct question, but not enough alignment to rely on assumptions.',
    };
  }
  if (average >= 2.2) {
    return {
      decision: 'Slow Down',
      reason: 'The evidence is mixed. Reduce emotional and practical investment until behavior becomes more consistent and clear.',
    };
  }
  return {
    decision: 'Exit',
    reason: 'The current pattern of behavior is too weak across several dimensions to justify continued investment.',
  };
}

function scriptsFor(style: Attachment, answers: Answers) {
  const styleScript: Record<Attachment, { title: string; text: string; avoid: string }> = {
    anxious: {
      title: 'When communication changes',
      text: 'I noticed the communication changed. I value consistency, so I wanted to ask directly whether you still want to continue getting to know each other.',
      avoid: 'Multiple follow-up messages designed to earn reassurance before the other person has answered once.',
    },
    avoidant: {
      title: 'When you need space without disappearing',
      text: 'I am feeling overwhelmed and need some space to think. I am not ending the conversation; I will check back in tomorrow evening.',
      avoid: 'Silence with no timeframe, leaving the other person to guess whether the connection still exists.',
    },
    fearful: {
      title: 'When you are too activated to decide',
      text: 'I care about this, and I am too activated to discuss it well tonight. I want to return to it tomorrow when I can be clear instead of reactive.',
      avoid: 'A breakup message written in the same moment you are hoping to be reassured.',
    },
    secure: {
      title: 'When calm interest needs more time',
      text: 'I am interested in getting to know you, and I prefer letting something real unfold instead of forcing instant certainty.',
      avoid: 'Ending a respectful connection solely because it did not create immediate fireworks.',
    },
  };

  return [
    styleScript[style],
    {
      title: 'When you need clarity',
      text: 'I enjoy this connection, and I am looking for something intentional. What are you genuinely available for right now?',
      avoid: 'Trying to infer commitment from frequency, chemistry, future jokes, or affectionate language alone.',
    },
    {
      title: 'When a boundary is crossed',
      text: 'That does not work for me. If we continue, I need us to handle this differently going forward.',
      avoid: 'Explaining the boundary until the other person agrees that you are allowed to have it.',
    },
    {
      title: 'When ambiguity keeps repeating',
      text: 'I do not need a rushed promise, but I do need consistency and direction. This no longer works for me, so I am stepping back.',
      avoid: `Remaining because “${answers.exes_pattern || 'potential'}” feels more important than the behavior available now.`,
    },
    {
      title: 'When conflict becomes disrespectful',
      text: 'I want to resolve this, but I will not continue while we are speaking to each other this way. I am pausing and will return tomorrow.',
      avoid: 'Winning the argument at the cost of safety, dignity, or a repairable conversation.',
    },
    {
      title: 'When you want exclusivity',
      text: 'I am ready to date exclusively. I want to know whether you are choosing the same direction, not because you feel pressured, but because it is genuinely what you want.',
      avoid: 'Acting exclusive while avoiding the conversation because the answer might change the connection.',
    },
  ];
}

function decisionClasses(decision: DateDecision) {
  if (decision === 'Continue') return 'border-[#2f7d57]/25 bg-[#edf8f1] text-[#245f43]';
  if (decision === 'Clarify') return 'border-[#7b6e22]/25 bg-[#fff9df] text-[#6b5b17]';
  if (decision === 'Slow Down') return 'border-[#a96720]/25 bg-[#fff4e7] text-[#7d4d16]';
  return 'border-[#9c2b2b]/25 bg-[#fff0f0] text-[#742424]';
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#751545]/10 bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[13.5px] font-medium text-[#3d0b26]">{label}</span>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${label}: ${score} out of 5`}
            onClick={() => onChange(score)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold transition ${
              value === score
                ? 'bg-[#751545] text-white shadow-sm'
                : 'border border-[#751545]/15 bg-[#fbf5ef] text-[#751545]/60 hover:border-[#751545]/40'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ResetDashboard({ answers, archetypeName }: { answers: Answers; archetypeName: string }) {
  const { style } = scoreAnswers(answers);
  const token = useMemo(getToken, []);
  const completionKey = `revela_reset_completed_${token}`;
  const datesKey = `revela_date_history_${token}`;
  const startKey = `revela_reset_started_${token}`;

  const [tab, setTab] = useState<Tab>('today');
  const [copied, setCopied] = useState<string | null>(null);
  const [trigger, setTrigger] = useState('distance');
  const [completedDays, setCompletedDays] = useState<number[]>(() =>
    safeJson<number[]>(localStorage.getItem(completionKey), []),
  );
  const [dateScores, setDateScores] = useState<DateScores>(DEFAULT_SCORES);
  const [person, setPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [dateHistory, setDateHistory] = useState<DateEntry[]>(() =>
    safeJson<DateEntry[]>(localStorage.getItem(datesKey), []),
  );

  const startTimestamp = useMemo(() => {
    const stored = Number(localStorage.getItem(startKey));
    if (Number.isFinite(stored) && stored > 0) return stored;
    const now = Date.now();
    localStorage.setItem(startKey, String(now));
    return now;
  }, [startKey]);
  const day = Math.min(30, Math.max(1, Math.floor((Date.now() - startTimestamp) / 86_400_000) + 1));
  const actions = useMemo(() => dailyActions(style, answers), [answers, style]);
  const action = actions[day - 1] ?? actions[actions.length - 1];
  const sos = sosContent(style, trigger, answers);
  const scripts = scriptsFor(style, answers);
  const liveDecision = evaluateDate(dateScores);

  const markToday = () => {
    const next = completedDays.includes(day) ? completedDays.filter((item) => item !== day) : [...completedDays, day];
    setCompletedDays(next);
    localStorage.setItem(completionKey, JSON.stringify(next));
  };

  const saveDate = () => {
    const result = evaluateDate(dateScores);
    const entry: DateEntry = {
      id: uniqueId(),
      createdAt: new Date().toISOString(),
      person: person.trim() || 'Private entry',
      notes: notes.trim(),
      scores: dateScores,
      decision: result.decision,
      reason: result.reason,
    };
    const next = [entry, ...dateHistory].slice(0, 30);
    setDateHistory(next);
    localStorage.setItem(datesKey, JSON.stringify(next));
    setPerson('');
    setNotes('');
    setDateScores(DEFAULT_SCORES);
  };

  const deleteDate = (id: string) => {
    const next = dateHistory.filter((entry) => entry.id !== id);
    setDateHistory(next);
    localStorage.setItem(datesKey, JSON.stringify(next));
  };

  const onCopy = (id: string, text: string) => {
    copyText(text, () => {
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <section className="no-print mx-auto mt-10 max-w-5xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-[#751545]/12 bg-white/80 shadow-[0_30px_90px_-55px_rgba(61,11,38,.55)] backdrop-blur-sm">
        <div className="border-b border-[#751545]/10 bg-gradient-to-r from-[#3d0b26] to-[#751545] px-6 py-6 text-[#fbf5ef] sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#edc840]">Your private workspace</p>
              <h2 className="font-display mt-2 text-2xl font-medium sm:text-3xl">Secure Love Reset Dashboard</h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/62">
                Use the tools during real moments—not only while reading. Progress and date entries are stored in this browser.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Current map</p>
              <p className="mt-1 font-display text-lg text-[#edc840]">{archetypeName}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border-b border-[#751545]/10 bg-[#fbf5ef]/80 px-3 sm:px-5">
          <div className="flex min-w-max gap-1 py-3" role="tablist" aria-label="Secure Love Reset tools">
            {TABS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition ${
                  tab === item.id
                    ? 'bg-[#751545] text-white shadow-sm'
                    : 'text-[#751545]/60 hover:bg-[#751545]/7 hover:text-[#751545]'
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {tab === 'today' && (
            <div role="tabpanel">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c4688a]">Day {day} of 30</p>
                  <h3 className="font-display mt-2 text-2xl font-medium text-[#3d0b26]">Today’s pattern interrupt</h3>
                </div>
                <div className="min-w-[170px] rounded-2xl border border-[#751545]/10 bg-[#fbf5ef] px-4 py-3">
                  <div className="flex items-center justify-between text-[11px] text-[#751545]/55">
                    <span>Completed</span>
                    <span className="font-semibold tabular-nums text-[#751545]">{completedDays.length}/30</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#751545]/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#751545] to-[#c4688a]" style={{ width: `${Math.round((completedDays.length / 30) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-3xl border border-[#c9a24b]/35 bg-[#fffaf0] p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a761f]">Five-to-ten-minute action</p>
                <p className="font-display mt-4 text-xl font-light leading-relaxed text-[#3d0b26] sm:text-2xl">{action}</p>
                <button
                  onClick={markToday}
                  className={`mt-6 rounded-full px-6 py-3 text-[13px] font-semibold transition ${
                    completedDays.includes(day)
                      ? 'border border-[#2f7d57]/25 bg-[#edf8f1] text-[#245f43]'
                      : 'bg-[#751545] text-white hover:scale-[1.01]'
                  }`}
                >
                  {completedDays.includes(day) ? 'Completed today ✓' : 'Mark today complete'}
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-[#751545]/10 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#751545]/50">Your working principle</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#4a1230]/78">
                  Do not ask whether the action feels dramatic. Ask whether it gives you cleaner information and a more deliberate next choice.
                </p>
              </div>
            </div>
          )}

          {tab === 'sos' && (
            <div role="tabpanel">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c4688a]">Use before reacting</p>
              <h3 className="font-display mt-2 text-2xl font-medium text-[#3d0b26]">Trigger & Text SOS</h3>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#4a1230]/68">
                Choose the moment you are in. This is a short decision pause, not crisis or mental-health support.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  ['distance', 'Communication changed'],
                  ['text', 'I want to send another text'],
                  ['conflict', 'We had a conflict'],
                  ['withdraw', 'I want to disappear'],
                  ['overthink', 'I am overthinking'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTrigger(id)}
                    className={`rounded-full px-4 py-2.5 text-[12px] font-semibold transition ${
                      trigger === id ? 'bg-[#751545] text-white' : 'border border-[#751545]/15 bg-[#fbf5ef] text-[#751545]/65'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-[#c9a24b]/30 bg-[#fffaf0] p-5 text-[14px] leading-relaxed text-[#5f4715]">
                <strong>{STYLE_LABELS[style]} reminder:</strong> {sos.reminder}
              </div>

              <ol className="mt-5 space-y-3">
                {sos.steps.map((step, index) => (
                  <li key={step} className="flex gap-4 rounded-2xl border border-[#751545]/10 bg-white/75 p-5 text-[14px] leading-relaxed text-[#4a1230]/78">
                    <span className="font-display text-lg text-[#c9a24b]">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-5 rounded-2xl border border-[#2f7d57]/20 bg-[#edf8f1] p-6">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#2f7d57]">Send this only when calm</p>
                <p className="font-display mt-3 text-lg font-light italic leading-relaxed text-[#245f43]">{sos.script}</p>
                <button onClick={() => onCopy(`sos-${trigger}`, sos.script.replace(/[“”]/g, ''))} className="mt-4 rounded-full border border-[#2f7d57]/25 px-4 py-2 text-[11.5px] font-semibold text-[#245f43]">
                  {copied === `sos-${trigger}` ? 'Copied ✓' : 'Copy script'}
                </button>
              </div>

              <p className="mt-4 rounded-2xl border border-[#9c2b2b]/15 bg-[#fff2f2] p-5 text-[13.5px] leading-relaxed text-[#6f3030]">
                <strong>Avoid:</strong> {sos.avoid}
              </p>
            </div>
          )}

          {tab === 'dates' && (
            <div role="tabpanel">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c4688a]">Observable evidence</p>
              <h3 className="font-display mt-2 text-2xl font-medium text-[#3d0b26]">Date Decision Dashboard</h3>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#4a1230]/68">
                Score behavior, not potential. The recommendation is a reflection prompt; context, safety, and your judgment still matter.
              </p>

              <div className="mt-6 grid gap-3">
                {(
                  [
                    ['consistency', 'Consistency over time'],
                    ['clarity', 'Clarity about intentions'],
                    ['respect', 'Respect for boundaries and dignity'],
                    ['followThrough', 'Follow-through on plans and words'],
                    ['emotionalAvailability', 'Emotional availability'],
                  ] as [keyof DateScores, string][]
                ).map(([key, label]) => (
                  <RatingRow
                    key={key}
                    label={label}
                    value={dateScores[key]}
                    onChange={(value) => setDateScores((current) => ({ ...current, [key]: value }))}
                  />
                ))}
              </div>

              <div className={`mt-5 rounded-2xl border p-6 ${decisionClasses(liveDecision.decision)}`}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] opacity-65">Current recommendation</p>
                <p className="font-display mt-2 text-2xl font-medium">{liveDecision.decision}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed opacity-85">{liveDecision.reason}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#3d0b26]">
                  Name or private label
                  <input value={person} onChange={(event) => setPerson(event.target.value)} maxLength={80} placeholder="Optional" className="mt-2 w-full rounded-xl border border-[#751545]/15 bg-white px-4 py-3 text-[13.5px] font-normal outline-none focus:border-[#751545]" />
                </label>
                <label className="text-[12px] font-semibold text-[#3d0b26] sm:col-span-2">
                  What happened—facts only
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={700} rows={3} placeholder="Plans made, actions taken, words used…" className="mt-2 w-full resize-none rounded-xl border border-[#751545]/15 bg-white px-4 py-3 text-[13.5px] font-normal leading-relaxed outline-none focus:border-[#751545]" />
                </label>
              </div>
              <button onClick={saveDate} className="mt-5 rounded-full bg-[#751545] px-6 py-3 text-[13px] font-semibold text-white">Save this decision</button>

              {dateHistory.length > 0 && (
                <div className="mt-9">
                  <h4 className="font-display text-xl font-medium text-[#3d0b26]">Your saved history</h4>
                  <div className="mt-4 space-y-3">
                    {dateHistory.map((entry) => (
                      <article key={entry.id} className="rounded-2xl border border-[#751545]/10 bg-white/75 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-[#3d0b26]">{entry.person}</p>
                            <p className="mt-1 text-[11px] text-[#751545]/45">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${decisionClasses(entry.decision)}`}>{entry.decision}</span>
                        </div>
                        {entry.notes && <p className="mt-3 text-[13px] leading-relaxed text-[#4a1230]/68">{entry.notes}</p>}
                        <p className="mt-3 text-[12.5px] leading-relaxed text-[#4a1230]/58">{entry.reason}</p>
                        <button onClick={() => deleteDate(entry.id)} className="mt-3 text-[11px] font-semibold text-[#9c2b2b]/70 underline underline-offset-2">Delete entry</button>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'scripts' && (
            <div role="tabpanel">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c4688a]">Words for difficult moments</p>
              <h3 className="font-display mt-2 text-2xl font-medium text-[#3d0b26]">Personal Script Vault</h3>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#4a1230]/68">
                Adapt the tone to your voice, but keep the structure: observation, need, question or boundary—without over-explaining.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {scripts.map((script, index) => (
                  <article key={script.title} className="flex h-full flex-col rounded-2xl border border-[#751545]/10 bg-white/75 p-5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#c4688a]">{script.title}</p>
                    <p className="font-display mt-3 flex-1 text-[17px] font-light italic leading-relaxed text-[#3d0b26]">“{script.text}”</p>
                    <p className="mt-4 border-t border-[#751545]/8 pt-4 text-[12px] leading-relaxed text-[#9c2b2b]/65"><strong>Avoid:</strong> {script.avoid}</p>
                    <button onClick={() => onCopy(`script-${index}`, script.text)} className="mt-4 self-start rounded-full border border-[#751545]/20 px-4 py-2 text-[11.5px] font-semibold text-[#751545]">
                      {copied === `script-${index}` ? 'Copied ✓' : 'Copy'}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === 'map' && (
            <div role="tabpanel">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#c4688a]">Your evidence map</p>
              <h3 className="font-display mt-2 text-2xl font-medium text-[#3d0b26]">The answers shaping this Reset</h3>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#4a1230]/68">
                These are the responses the system is organizing. They are not proof of one cause or a fixed identity.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ['Pattern hypothesis', `${archetypeName} · ${STYLE_LABELS[style]}`],
                  ['When someone pulls away', answers.he_pulls_away || 'Not provided'],
                  ['Conflict response', answers.conflict_style || 'Not provided'],
                  ['Pattern across exes', answers.exes_pattern || 'Not provided'],
                  ['How attraction develops', answers.falling_style || 'Not provided'],
                  ['What you want next', answers.marriage_timeline || 'Not provided'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#751545]/10 bg-white/75 p-5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#751545]/45">{label}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#3d0b26]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#c9a24b]/30 bg-[#fffaf0] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6818]">Use the map this way</p>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5f4715]">
                  Treat every interpretation as a hypothesis to test against real behavior. Keep what produces clearer choices; discard what does not fit your experience.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

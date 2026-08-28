import type { DeepReport } from './components/Report';
import type { Answers } from './lib/engine';

export const SAMPLE_ANSWERS: Answers = {
  name: 'Sofia',
  single_duration: '3 – 5 years',
  home_climate: 'Loving, but unpredictable',
  father_figure: 'Present, but emotionally unavailable',
  child_comfort: 'I learned not to ask',
  breakup_pattern: 'They left me',
  exes_pattern: 'They were emotionally unavailable',
  he_pulls_away: 'Move closer, text more',
  conflict_style: 'Over-apologize to end it fast',
  falling_style: 'Fast and hard',
  marriage_timeline: '1 – 2 years',
  children_dream: 'I dream of it constantly',
  readiness: 'Yes — absolutely',
  own_words: 'I keep choosing men who need fixing. Maybe I am too much, or maybe I just have terrible luck.',
};

export const SAMPLE_DEEP: DeepReport = {
  archetype: 'The Earned-Love Loop',
  archetypeLine: 'You may feel safest when love gives you a role to perform, even when that role leaves little room to receive.',
  headline: 'The question is not whether you care too much. It is whether care has become your way of managing uncertainty.',
  hook: 'Sofia, your answers suggest that when interest becomes uncertain, you increase effort before checking whether the other person is increasing his.',
  openingLetter: `Sofia, you described a pattern that deserves a kinder explanation than “I am too much.” You said that you fall fast, often choose emotionally unavailable men, move closer when someone pulls away, and over-apologize during conflict. Put together, those answers suggest that uncertainty may not simply frighten you; it may recruit you. The less certain the connection becomes, the more useful, understanding, or accommodating you may try to become.

That response is understandable. You also described a loving but unpredictable home, a father who was present but emotionally unavailable, and learning not to ask for comfort. Those answers do not prove one cause, and they do not define you. They do suggest a possibility worth testing: perhaps being easy to love once felt safer than openly needing love. If so, giving more may feel active and familiar, while waiting to see whether someone reaches for you can feel exposed.

The purpose of this Reset is not to make you colder or less generous. It is to place evaluation before over-investment. You can care and still ask whether the other person is clear, consistent, respectful, and available. You can express a need without apologizing for having it. And you can let another person’s behavior answer the question that extra effort cannot answer: is he choosing the relationship too?`,

  corePattern: `Your answers suggest a sequence that may begin with rapid emotional investment. “Fast and hard” can create a powerful sense of meaning before ordinary behavior has had time to provide evidence. Early chemistry then becomes a reason to imagine what the relationship could become, while consistency, clarity, and follow-through remain partly untested.

When the other person becomes less responsive, your selected response is to move closer and text more. One plausible example—not a memory or a claim about every relationship—would be a promising week followed by a quieter weekend. You notice the change, review the conversation, send a warm check-in, then add another message to remove any possible misunderstanding. Each action is caring on its own. Together, they can shift all responsibility for restoring connection onto you.

If conflict follows, over-apologizing may end the discomfort quickly without resolving what you needed. The immediate reward is relief; the longer-term cost is less information. You do not learn whether the other person can tolerate your disappointment, repair a misunderstanding, or respond to a clear boundary. The loop therefore is not “you give too much.” It may be: uncertainty appears, effort increases, your need becomes quieter, and the other person’s capacity remains untested until the ending.`,

  rootCause: `A loving but unpredictable home can teach many different lessons. One possible lesson is heightened attention to other people’s moods: noticing tone, timing, and distance early because adaptation once helped preserve connection. A father who was physically present but emotionally difficult to reach may also make partial availability feel familiar. Familiar does not mean desirable, inevitable, or permanently wired; it simply deserves to be distinguished from compatibility.

Learning not to ask for comfort may have protected you from disappointment at the time. In adult relationships, the same strategy can make your needs visible only after they have become urgent. That is why this program focuses on smaller, earlier statements: naming what changed, asking one direct question, and allowing the answer to arrive through words and behavior. The useful goal is not to prove exactly where the pattern began. It is to notice what activates it now and practice a response that produces clearer information.`,

  hiddenTruth: `You wrote that you may be “too much,” yet several answers describe the opposite behavior: making your needs smaller, apologizing quickly, and doing extra relational work when the other person becomes uncertain. The blind spot may be that you measure your emotional intensity internally while the other person mostly experiences your accommodation externally.

That distinction is hopeful because it creates a practical choice. You do not need to become less feeling. You can make your standards and needs more visible earlier, then watch whether the other person meets them without being coached into every step. The change is not from caring to withholding; it is from carrying the connection to participating in a connection that is carried by two people.`,

  herWordsReflected: `You wrote: “I keep choosing men who need fixing. Maybe I am too much, or maybe I just have terrible luck.” A more testable interpretation is that potential may sometimes receive more weight than present behavior. That is not a verdict about you. It is a selection habit you can examine earlier, using consistency, clarity, respect, and follow-through as evidence.`,

  manSheNeeds: [
    'Someone whose interest remains visible during ordinary weeks, not only during intense beginnings. He confirms plans, follows through, and communicates changes without making you investigate the connection. This matters because consistency gives you evidence before your imagination or anxiety has to fill the gap.',
    'Someone who can answer a direct question without punishing you for asking it. When you name a need or uncertainty, he does not mock it, disappear, or offer just enough reassurance to postpone clarity. His response helps you understand reality rather than manage his comfort.',
    'Someone who participates in repair. During disagreement he stays respectful, can acknowledge impact without collapsing into blame, and returns to the conversation after a defined pause. You need evidence that conflict can reveal character and compatibility instead of automatically threatening the entire bond.',
    'Someone whose relationship goals are compatible with yours and whose behavior supports those goals. He can discuss marriage and family without using future language as instant intimacy. Over time, his choices—availability, pacing, exclusivity, and planning—match the direction he says he wants.',
  ],

  ninetyDayPath: [
    {
      title: 'Weeks 1–2 · Notice Before Increasing Effort',
      text: 'Track the first moment a change in attention creates urgency. Write two lines: “What happened” and “What I fear it means.” Before sending an additional message, wait until your intensity is below six out of ten. Then use one sentence: “I noticed the communication changed, and I wanted to ask directly whether you still want to continue getting to know each other.” Let one clear question stand.',
    },
    {
      title: 'Weeks 3–6 · Evaluate Behavior, Not Potential',
      text: 'After meaningful dates or conversations, record what was promised and what occurred. A green flag is calm follow-through: plans are confirmed, changes are communicated, and questions receive direct answers. A red flag is temporary clarity only when you begin to step away. Continue gathering evidence when behavior is consistent; slow your investment when ambiguity becomes the repeated structure.',
    },
    {
      title: 'Weeks 7–12 · Make Direction Discussable',
      text: 'When mutual interest and several weeks of consistent behavior are present, initiate a direction conversation rather than acting exclusive by implication. Say: “I am dating toward a committed relationship and family. I do not need a rushed promise, but I want to know whether that is genuinely the direction you are available for.” Compare the answer with behavior over the following weeks before making a larger commitment.',
    },
  ],

  fieldGuide: {
    scripts: [
      {
        situation: 'Communication becomes noticeably less consistent',
        sayThis: 'I noticed the communication changed. I value consistency, so I wanted to ask directly whether you still want to continue getting to know each other.',
        notThis: 'Sending several increasingly emotional messages before receiving an answer to the first one.',
      },
      {
        situation: 'You disagree and feel tempted to apologize for everything',
        sayThis: 'I care about resolving this. I can own my part without taking responsibility for the entire conflict, so I would like us to discuss both sides.',
        notThis: 'Ending the discomfort by agreeing that every problem was your fault.',
      },
      {
        situation: 'The connection is affectionate but its direction remains vague',
        sayThis: 'I enjoy this connection, and I am looking for something intentional. What are you genuinely available for right now?',
        notThis: 'Treating frequency, chemistry, or future jokes as an exclusivity conversation.',
      },
    ],
    greenFlags: [
      'He follows through on small plans without requiring reminders or emotional pressure.',
      'He answers reasonable questions directly, even when the answer is not perfectly convenient.',
      'He respects a boundary without withdrawing affection, mocking it, or negotiating it repeatedly.',
      'After tension, he returns at the agreed time and participates in repair.',
    ],
    redFlags: [
      'His interest becomes clearest only when you reduce contact or prepare to leave.',
      'He describes future possibilities while avoiding present-tense commitments and concrete plans.',
      'You repeatedly explain his inconsistency through stress, potential, timing, or what he might become.',
      'A direct question produces blame, vagueness, disappearance, or a change of subject instead of information.',
    ],
  },

  closingLine: 'You do not need perfect certainty to choose differently; you need enough calm to let observable behavior count.',
};

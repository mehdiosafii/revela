// ─────────────────────────────────────────────────────────────
// Revela — quiz engine, scoring, zodiac & report generation
// ─────────────────────────────────────────────────────────────

export type Answers = Record<string, string>;

export type QType =
  | 'text'
  | 'email'
  | 'date'
  | 'tel'
  | 'qcm'
  | 'textarea'
  | 'photo'
  | 'revelation';

export interface Option {
  label: string;
  sub?: string;
  scores?: Partial<Record<'anxious' | 'avoidant' | 'fearful' | 'secure', number>>;
}

export interface Question {
  id: string;
  type: QType;
  chapter?: string;
  title: string;
  subtitle?: string;
  placeholder?: string;
  options?: Option[];
  motivation: string; // words shown beside the Next button
}

export const QUESTIONS: Question[] = [
  {
    id: 'name',
    type: 'text',
    chapter: 'Let’s begin gently',
    title: 'First — what should we call you?',
    subtitle: 'Your report will be written for you, personally.',
    placeholder: 'Your first name…',
    motivation: 'Beautiful. Let’s begin →',
  },
  {
    id: 'email',
    type: 'email',
    chapter: 'Your private channel',
    title: 'Where should we send your full Revela report?',
    subtitle: 'Encrypted, private, never shared. This is between you and you.',
    placeholder: 'you@example.com',
    motivation: 'Safe with us. Continue →',
  },
  {
    id: 'dob',
    type: 'date',
    chapter: 'The day it all started',
    title: 'What is your date of birth?',
    subtitle: 'Age shapes patterns more than most women realize.',
    motivation: 'Every detail matters →',
  },
  {
    id: 'phone',
    type: 'tel',
    chapter: 'A direct line to you',
    title: 'Your phone number?',
    subtitle: 'Optional but recommended — for your private results delivery and a personal follow-up from our team.',
    placeholder: '+1 (555) 000-0000',
    motivation: 'Almost through the formalities →',
  },


  // — Q5: first real question, then the revelation hits —
  {
    id: 'single_duration',
    type: 'qcm',
    chapter: 'Chapter I — Where you are now',
    title: 'How long have you been single?',
    options: [
      { label: 'Less than a year', sub: 'Fresh out of something', scores: { anxious: 1 } },
      { label: '1 – 3 years', sub: 'A real stretch of solitude', scores: { fearful: 1 } },
      { label: '3 – 5 years', sub: 'Long enough to wonder', scores: { avoidant: 1 } },
      { label: 'More than 5 years', sub: 'Long enough to doubt', scores: { avoidant: 1, fearful: 1 } },
      { label: 'I’ve never had a serious relationship', scores: { fearful: 1, anxious: 1 } },
    ],
    motivation: 'Honesty is power →',
  },
  { id: 'revelation', type: 'revelation', title: '', motivation: 'I want to know more →' },

  // — Childhood & parents —
  {
    id: 'home_climate',
    type: 'qcm',
    chapter: 'Chapter II — The little girl in you',
    title: 'Growing up, your home felt…',
    subtitle: 'No right answers. Only true ones.',
    options: [
      { label: 'Safe and warm', sub: 'Love was steady and predictable', scores: { secure: 2 } },
      { label: 'Loving, but unpredictable', sub: 'You never knew which version of today you’d get', scores: { anxious: 2 } },
      { label: 'Emotionally distant', sub: 'Needs were met — except the emotional ones', scores: { avoidant: 2 } },
      { label: 'Tense — I walked on eggshells', sub: 'You became an expert at reading rooms', scores: { fearful: 2 } },
    ],
    motivation: 'This takes courage →',
  },
  {
    id: 'father_figure',
    type: 'qcm',
    chapter: 'Chapter II — The little girl in you',
    title: 'Your father (or father figure) was…',
    subtitle: 'This one matters more than you think. He was your first template for men.',
    options: [
      { label: 'Present and affectionate', sub: 'I felt chosen by him', scores: { secure: 2 } },
      { label: 'Present, but emotionally unavailable', sub: 'He was there, but not really there', scores: { anxious: 2 } },
      { label: 'Mostly absent', sub: 'Physically or emotionally — a gap', scores: { anxious: 1, fearful: 1 } },
      { label: 'Inconsistent', sub: 'Warm one day, gone the next', scores: { anxious: 1, fearful: 1 } },
      { label: 'Strict or hard to please', sub: 'Love felt earned, not given', scores: { anxious: 2, avoidant: 1 } },
    ],
    motivation: 'You’re doing beautifully →',
  },
  {
    id: 'mother_love',
    type: 'qcm',
    chapter: 'Chapter II — The little girl in you',
    title: 'Your mother taught you — by words or by example — that love is…',
    options: [
      { label: 'Unconditional', sub: 'You are loved simply because you exist', scores: { secure: 2 } },
      { label: 'Earned by being good', sub: 'Achieve, behave, don’t be a burden', scores: { anxious: 2 } },
      { label: 'Something you manage and control', sub: 'Stay useful, stay needed, stay safe', scores: { avoidant: 2 } },
      { label: 'Complicated and costly', sub: 'Love always seemed to come with a price', scores: { fearful: 2 } },
    ],
    motivation: 'Keep going — this is gold →',
  },
  {
    id: 'child_comfort',
    type: 'qcm',
    chapter: 'Chapter II — The little girl in you',
    title: 'As a child, when you were hurting and needed comfort…',
    options: [
      { label: 'I received it', sub: 'Someone soft was there', scores: { secure: 2 } },
      { label: 'I learned not to ask', sub: 'Easier to handle it alone', scores: { avoidant: 2 } },
      { label: 'I comforted others instead', sub: 'You were the strong one, early', scores: { anxious: 1, avoidant: 1 } },
      { label: 'It depended on their mood', sub: 'You had to earn the right to be sad', scores: { anxious: 2 } },
    ],
    motivation: 'Halfway through this chapter →',
  },

  // — Exes —
  {
    id: 'breakup_pattern',
    type: 'qcm',
    chapter: 'Chapter III — The loves behind you',
    title: 'Your past relationships usually ended because…',
    options: [
      { label: 'I pulled away first', sub: 'Leaving felt safer than being left', scores: { avoidant: 2 } },
      { label: 'They left me', sub: 'Often when I was finally all in', scores: { anxious: 2 } },
      { label: 'A slow, silent fade', sub: 'No fight — just drift', scores: { avoidant: 1, fearful: 1 } },
      { label: 'Explosive endings', sub: 'Intensity, tears, then nothing', scores: { fearful: 2 } },
    ],
    motivation: 'Patterns are surfacing →',
  },
  {
    id: 'exes_pattern',
    type: 'qcm',
    chapter: 'Chapter III — The loves behind you',
    title: 'When you line your exes up side by side, you notice…',
    options: [
      { label: 'They were emotionally unavailable', sub: 'Different faces, same wall', scores: { anxious: 2 } },
      { label: 'I chose potential over reality', sub: 'I fell for who they could become', scores: { anxious: 1, fearful: 1 } },
      { label: 'Intense at first, then cold', sub: 'The chase was the whole relationship', scores: { fearful: 2 } },
      { label: 'I lost myself in them', sub: 'My world shrank to fit theirs', scores: { anxious: 2 } },
      { label: 'Honestly — no clear pattern', sub: 'Which is a pattern in itself', scores: { avoidant: 1 } },
    ],
    motivation: 'You’re seeing it now →',
  },
  {
    id: 'last_lesson',
    type: 'text',
    chapter: 'Chapter III — The loves behind you',
    title: 'In one or two words — what did your last relationship teach you?',
    placeholder: 'Type it raw. One word is enough…',
    motivation: 'Noted. Forward →',
  },

  // — How she handles love —
  {
    id: 'he_pulls_away',
    type: 'qcm',
    chapter: 'Chapter IV — How you love',
    title: 'When a man you like pulls away, you…',
    options: [
      { label: 'Move closer, text more', sub: 'Silence feels like an emergency', scores: { anxious: 2 } },
      { label: 'Match his distance', sub: 'Two can play at being fine', scores: { avoidant: 2 } },
      { label: 'Overthink every word I said', sub: 'Replaying conversations at 2 a.m.', scores: { anxious: 1, fearful: 1 } },
      { label: 'Calmly ask what’s going on', sub: 'Direct, no games', scores: { secure: 2 } },
    ],
    motivation: 'So honest. Continue →',
  },
  {
    id: 'conflict_style',
    type: 'qcm',
    chapter: 'Chapter IV — How you love',
    title: 'In conflict with a partner, you tend to…',
    options: [
      { label: 'Explode, then regret it', sub: 'The volcano, then the apology tour', scores: { fearful: 2 } },
      { label: 'Shut down completely', sub: 'The wall goes up, nobody gets in', scores: { avoidant: 2 } },
      { label: 'Over-apologize to end it fast', sub: 'Peace at any price — even my truth', scores: { anxious: 2 } },
      { label: 'Talk it through calmly', sub: 'Uncomfortable, but worth it', scores: { secure: 2 } },
    ],
    motivation: 'Two more in this chapter →',
  },
  {
    id: 'falling_style',
    type: 'qcm',
    chapter: 'Chapter IV — How you love',
    title: 'You fall for someone…',
    options: [
      { label: 'Fast and hard', sub: 'All in, within weeks', scores: { anxious: 2 } },
      { label: 'Slowly, behind high walls', sub: 'They have to earn every brick removed', scores: { avoidant: 2 } },
      { label: 'Mostly when they can’t fully have me', sub: 'Distance makes him irresistible', scores: { fearful: 2 } },
      { label: 'Rarely — and cautiously', sub: 'Feelings are a risk assessment', scores: { avoidant: 1, fearful: 1 } },
    ],
    motivation: 'This chapter is complete →',
  },

  // — What she wants —
  {
    id: 'marriage_timeline',
    type: 'qcm',
    chapter: 'Chapter V — The life you want',
    title: 'If you met the right man tomorrow — honestly — how soon would you want marriage?',
    options: [
      { label: 'Within a year', sub: 'When you know, you know', scores: { anxious: 1 } },
      { label: '1 – 2 years', sub: 'Fast, but built right', scores: { secure: 1 } },
      { label: '3+ years', sub: 'Slow proof over fast promises', scores: { avoidant: 1 } },
      { label: 'I want it — but the thought scares me', scores: { fearful: 2 } },
    ],
    motivation: 'Dreaming is allowed →',
  },
  {
    id: 'children_dream',
    type: 'qcm',
    chapter: 'Chapter V — The life you want',
    title: 'Children — what does that picture look like in your heart?',
    options: [
      { label: 'I dream of it constantly', sub: 'The family is the whole point', scores: { anxious: 1, secure: 1 } },
      { label: 'Yes — with the right man, at the right time', scores: { secure: 2 } },
      { label: 'I want it but I’m running out of faith', scores: { fearful: 1, anxious: 1 } },
      { label: 'Unsure — I need to feel safe first', scores: { avoidant: 1, fearful: 1 } },
    ],
    motivation: 'Your heart is showing →',
  },
  {
    id: 'own_words',
    type: 'textarea',
    chapter: 'Chapter V — The life you want',
    title: 'In your own words — why do you think you’re still single?',
    subtitle: 'Say it exactly how you’d say it to your closest friend at 1 a.m. No filter. This answer changes your report the most.',
    placeholder: 'Honestly? I think…',
    motivation: 'Thank you for trusting us →',
  },
  {
    id: 'photo',
    type: 'photo',
    chapter: 'Final touch',
    title: 'Add a photo of yourself',
    subtitle: 'Private and encrypted — it helps our team (and your coach) put a face to your story. You may skip, but 94% of women add one.',
    motivation: 'Last step. You did it →',
  },
  {
    id: 'readiness',
    type: 'qcm',
    chapter: 'One last thing',
    title: 'If we could show you exactly what has been blocking the love you want… would you be ready to see it?',
    options: [
      { label: 'Yes — absolutely', sub: 'I’m done guessing', scores: { secure: 1 } },
      { label: 'I’m nervous — but yes', sub: 'The truth, even if it stings', scores: { anxious: 1 } },
    ],
    motivation: 'Reveal my results →',
  },
];

// ── Zodiac ──────────────────────────────────────────────────
export interface Zodiac {
  sign: string;
  symbol: string;
  element: string;
  trait: string;
  stars: [number, number][];
  lines: [number, number][];
}

type ZEntry = Omit<Zodiac, 'stars' | 'lines'> & {
  from: [number, number];
  to: [number, number];
  stars: [number, number][];
  lines: [number, number][];
};

const ZODIACS: ZEntry[] = [
  { sign: 'Capricorn', symbol: '♑', element: 'Earth', trait: 'you build walls only the patient ever climb', from: [12, 22], to: [1, 19],
    stars: [[12, 58], [28, 42], [44, 52], [62, 40], [82, 54], [70, 72], [40, 70]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2]] },
  { sign: 'Aquarius', symbol: '♒', element: 'Air', trait: 'you love from a thoughtful distance', from: [1, 20], to: [2, 18],
    stars: [[10, 48], [24, 40], [38, 48], [52, 40], [66, 48], [80, 40], [46, 62], [60, 70]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 7]] },
  { sign: 'Pisces', symbol: '♓', element: 'Water', trait: 'you feel everything, including what he never says', from: [2, 19], to: [3, 20],
    stars: [[12, 70], [24, 58], [36, 48], [50, 44], [64, 48], [78, 58], [88, 70]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
  { sign: 'Aries', symbol: '♈', element: 'Fire', trait: 'you chase — and get bored when caught', from: [3, 21], to: [4, 19],
    stars: [[30, 68], [42, 52], [56, 40], [70, 46]],
    lines: [[0, 1], [1, 2], [2, 3]] },
  { sign: 'Taurus', symbol: '♉', element: 'Earth', trait: 'you love slowly, and leave even slower', from: [4, 20], to: [5, 20],
    stars: [[14, 40], [30, 46], [44, 42], [56, 34], [60, 54], [72, 60], [50, 66]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6]] },
  { sign: 'Gemini', symbol: '♊', element: 'Air', trait: 'your heart runs two stories at once', from: [5, 21], to: [6, 20],
    stars: [[36, 30], [58, 30], [40, 48], [62, 48], [36, 68], [58, 68]],
    lines: [[0, 2], [1, 3], [2, 3], [2, 4], [3, 5]] },
  { sign: 'Cancer', symbol: '♋', element: 'Water', trait: 'you mother the men you should be dating', from: [6, 21], to: [7, 22],
    stars: [[30, 62], [44, 50], [60, 40], [74, 28], [66, 58]],
    lines: [[0, 1], [1, 2], [2, 3], [1, 4]] },
  { sign: 'Leo', symbol: '♌', element: 'Fire', trait: 'you need admiration as much as affection', from: [7, 23], to: [8, 22],
    stars: [[22, 56], [32, 42], [44, 32], [58, 30], [70, 38], [78, 52], [66, 64], [48, 62]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]] },
  { sign: 'Virgo', symbol: '♍', element: 'Earth', trait: 'you audit men like spreadsheets — and miss the magic', from: [8, 23], to: [9, 22],
    stars: [[18, 50], [32, 42], [46, 48], [60, 40], [74, 46], [60, 60], [46, 68]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 2]] },
  { sign: 'Libra', symbol: '♎', element: 'Air', trait: 'you lose yourself keeping the peace', from: [9, 23], to: [10, 22],
    stars: [[50, 28], [34, 48], [66, 48], [50, 66]],
    lines: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]] },
  { sign: 'Scorpio', symbol: '♏', element: 'Water', trait: 'you test men until they fail — or run', from: [10, 23], to: [11, 21],
    stars: [[14, 40], [26, 34], [38, 40], [50, 50], [60, 62], [72, 70], [84, 66], [86, 54]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]] },
  { sign: 'Sagittarius', symbol: '♐', element: 'Fire', trait: 'you want roots and wings at the same time', from: [11, 22], to: [12, 21],
    stars: [[28, 70], [40, 56], [52, 46], [64, 56], [76, 70], [52, 32], [40, 34], [64, 34]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7]] },
];

export function getZodiac(dob: string): Zodiac | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  for (const { from, to, ...rest } of ZODIACS) {
    if (from[0] === to[0]) {
      if (m === from[0] && day >= from[1] && day <= to[1]) return rest;
    } else if ((m === from[0] && day >= from[1]) || (m === to[0] && day <= to[1])) {
      return rest;
    }
  }
  return null;
}

export function getAge(dob: string): number | null {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age > 0 && age < 120 ? age : null;
}

// ── Scoring ─────────────────────────────────────────────────
export type Attachment = 'anxious' | 'avoidant' | 'fearful' | 'secure';

export function scoreAnswers(answers: Answers): { style: Attachment; scores: Record<Attachment, number> } {
  const scores: Record<Attachment, number> = { anxious: 0, avoidant: 0, fearful: 0, secure: 0 };
  for (const q of QUESTIONS) {
    if (q.type !== 'qcm' || !q.options) continue;
    const a = answers[q.id];
    if (!a) continue;
    const opt = q.options.find((o) => o.label === a);
    if (opt?.scores) {
      for (const [k, v] of Object.entries(opt.scores)) {
        scores[k as Attachment] += v ?? 0;
      }
    }
  }
  let style: Attachment = 'secure';
  let best = -1;
  (Object.keys(scores) as Attachment[]).forEach((k) => {
    if (scores[k] > best) {
      best = scores[k];
      style = k;
    }
  });
  return { style, scores };
}

// ── Revela social-proof reviews (toast pool) ────────────────
export interface Review {
  name: string;
  place: string;
  text: string;
  ago: string;
}

export const REVIEWS: Review[] = [
  { name: 'Amira K.', place: 'Dubai', text: 'Question 7 broke me. It described my father wound better than my therapist did in 6 months.', ago: '2 min ago' },
  { name: 'Sofia R.', place: 'Milan', text: 'I took it as a joke. Cried by question 12. Engaged 8 months later. I’m not saying it was Revela… but it was Revela.', ago: '5 min ago' },
  { name: 'Jessica M.', place: 'Austin', text: 'The report knew things I never typed. Still don’t fully understand how. Worth every second.', ago: '9 min ago' },
  { name: 'Léa D.', place: 'Paris', text: 'I stopped chasing emotionally unavailable men within weeks. My fiancé says thank you.', ago: '12 min ago' },
  { name: 'Hannah B.', place: 'London', text: '34, single 6 years. The “pattern” section read me like a letter from my childhood.', ago: '18 min ago' },
  { name: 'Chloe T.', place: 'Toronto', text: 'Sent it to my sister. She called me crying. We both booked the call.', ago: '24 min ago' },
  { name: 'Nadia S.', place: 'Casablanca', text: 'The question about my mother… I had to put my phone down and breathe. Then everything made sense.', ago: '31 min ago' },
  { name: 'Emily W.', place: 'Sydney', text: 'Married last June. Baby due in spring. I keep the report framed. Not joking.', ago: '40 min ago' },
  { name: 'Yasmine A.', place: 'Doha', text: 'I finally understood why “good men” bored me. That insight alone changed who I date.', ago: '46 min ago' },
  { name: 'Grace O.', place: 'Lagos', text: 'Did it at midnight. Finished at 12:40. Rewrote my entire dating approach the same night.', ago: '52 min ago' },
];

// ── Motivation strip (rotates under the form) ───────────────
export const ENCOURAGEMENTS = [
  'You’re braver than most women ever get.',
  'Patterns only break when they’re seen.',
  'Your future husband thanks you for this.',
  'No judgment here. Only truth.',
  'Every answer sharpens your report.',
  'This is the work most people avoid. Not you.',
  'The little girl in you is listening.',
  'You’re closer than you think.',
];

// ── Report generation ───────────────────────────────────────
export interface Report {
  name: string;
  zodiac: Zodiac | null;
  age: number | null;
  style: Attachment;
  styleName: string;
  headline: string;
  subheadline: string;
  pattern: string[];
  fatherWound: string;
  realReason: string;
  herWords: string | null;
  manSheNeeds: string[];
  path: { title: string; text: string }[];
}

const STYLE_META: Record<Attachment, { name: string; headline: string; sub: string }> = {
  anxious: {
    name: 'The Over-Giver',
    headline: 'You love harder than you allow yourself to be loved.',
    sub: 'Your pattern: pursuit. You over-invest early, read silence as danger, and call anxiety “chemistry.” The men who feel “exciting” are often simply inconsistent — and consistency reads to you as boredom.',
  },
  avoidant: {
    name: 'The Fortress',
    headline: 'You want love — as long as it never requires you to need it.',
    sub: 'Your pattern: protection. You keep one foot out the door, prize self-sufficiency, and call it standards. Men experience you as magnetic and unreachable — and the good ones eventually stop trying to reach you.',
  },
  fearful: {
    name: 'The Wave',
    headline: 'You crave closeness and fear it in the same breath.',
    sub: 'Your pattern: push-pull. Intensity feels like home — so you cycle between all-in and all-out. Relationships become storms: unforgettable, exhausting, and rarely long enough to become safe.',
  },
  secure: {
    name: 'The Threshold',
    headline: 'You’re closer than you think — one blind spot stands between you and the ring.',
    sub: 'Your pattern is subtle: you love well, but you choose from caution instead of desire. You pass on the right men for almost-right reasons, and the clock on the family you want keeps ticking.',
  },
};

const FATHER_WOUNDS: Record<string, string> = {
  'Present and affectionate':
    'Your father gave you a rare gift: a baseline of being chosen. Your challenge isn’t the wound — it’s the comparison. You quietly measure men against a standard few match on date three, and dismiss good men before their depth has time to show.',
  'Present, but emotionally unavailable':
    'He was there — but not reachable. So you learned that love means performing for attention that never quite arrives. Today you over-function in relationships: you give 120%, then resent men for accepting it. The unavailable men you keep meeting aren’t bad luck. They’re familiar.',
  'Mostly absent':
    'An absent father leaves a specific inheritance: a quiet belief that men leave, and that your job is to be worth staying for. You either chase too hard or test too early. Both push away exactly the steady man you’re looking for.',
  'Inconsistent':
    'Warm one day, gone the next — so your nervous system learned that love is weather, not climate. Unpredictability now feels like passion, and steady men feel “off.” That’s not intuition. That’s conditioning.',
  'Strict or hard to please':
    'Love was earned through achievement — so you bring your résumé to romance. You audition instead of connect. The right man doesn’t need you impressive. He needs you present.',
};

const REAL_REASONS: Record<Attachment, string> = {
  anxious:
    'Here is the sentence no one has said to you plainly: you are not single because you’re too much. You’re single because you keep offering your whole heart to men who only rented a room in theirs. Your urgency — beautiful, urgent, family-shaped urgency — makes you skip the selection phase. You fall for potential because reality requires patience you were never taught. The right man won’t need to be chased. He’ll need to be recognized — and recognition is a skill you’re about to learn.',
  avoidant:
    'Here is the sentence no one has said to you plainly: you are not single because you haven’t found him. You’re single because part of you wins every time he gets close. You call it independence, standards, timing. Underneath it is an old lesson — that needing someone is how you get hurt. The tragedy isn’t that you push men away. It’s that you push away the safe ones and keep the distant ones, because distance is the only love that doesn’t scare you.',
  fearful:
    'Here is the sentence no one has said to you plainly: you are not single because love doesn’t want you. You’re single because your heart runs two commands at once — come closer, stay back — and men feel both. You’ve confused intensity with intimacy because intensity is what love looked like when you were small. The calm man you need will feel strange at first. Strange is not wrong. Strange is new — and new is the entire point.',
  secure:
    'Here is the sentence no one has said to you plainly: you are not broken — you are under-leveraged. You love sanely in a dating market that rewards chaos. Your blind spot isn’t dysfunction; it’s passivity. You wait to be chosen instead of choosing with intention. The marriage and children you want don’t need a new you. They need a more deliberate one.',
};

const MAN_NEEDS: Record<Attachment, string[]> = {
  anxious: [
    'Consistent — his words and actions match on Tuesday, not just on date night',
    'Verbally reassuring — he names what he feels before you have to ask',
    'Comfortable with your family dream — he says “when,” not “someday maybe”',
    'Boredom-proof — you’ll need to relearn that calm is love, not absence of it',
  ],
  avoidant: [
    'Patient without being passive — he stays curious when you go quiet',
    'Has his own full life — so your independence feels safe, not threatened',
    'Gently direct — he names the wall instead of pretending it isn’t there',
    'Commitment-clear — he talks about marriage and children in specifics, early',
  ],
  fearful: [
    'Emotionally regulated — his calm lowers your alarm instead of feeding it',
    'Predictably warm — affection on ordinary days, not just after conflict',
    'Direct about the future — no ambiguity for your mind to spiral in',
    'Strong enough to stay — when you push, he doesn’t chase or vanish. He stays.',
  ],
  secure: [
    'Intentional — a man with a timeline, not a vibe',
    'Family-forward — he wants children out loud, not in footnotes',
    'Your intellectual equal — so respect never has to be faked',
    'Chosen by you, not just choosing you — this time you decide deliberately',
  ],
};

export function buildReport(answers: Answers): Report {
  const name = answers.name || 'Beautiful stranger';
  const zodiac = getZodiac(answers.dob);
  const age = getAge(answers.dob);
  const { style } = scoreAnswers(answers);
  const meta = STYLE_META[style];

  const pattern: string[] = [];

  // home climate insight
  const home = answers.home_climate;
  if (home === 'Loving, but unpredictable')
    pattern.push('An unpredictable childhood home trained you to scan for shifts in mood — which is why a man’s one-word text can hijack your whole evening.');
  else if (home === 'Emotionally distant')
    pattern.push('In an emotionally distant home, you became self-sufficient out of necessity. Today, men admire your strength — and never guess how rarely you let anyone help.');
  else if (home === 'Tense — I walked on eggshells')
    pattern.push('Walking on eggshells made you a world-class reader of rooms. The cost: in love, you manage his emotions before you’ve felt your own.');
  else if (home === 'Safe and warm')
    pattern.push('A warm home gave you a steady core — your challenge is not healing, it’s discernment. You assume others love the way your family did. Not all of them do.');

  // comfort insight
  const comfort = answers.child_comfort;
  if (comfort === 'I learned not to ask')
    pattern.push('You learned early not to ask for comfort — so now you don’t ask for reassurance, clarity, or commitment either. Men read your silence as “she doesn’t need much.” They’re wrong.');
  else if (comfort === 'I comforted others instead')
    pattern.push('You were the little adult — the comforter. Notice how your relationships still cast you in that role: his therapist, his muse, his rock. Who comforts you?');
  else if (comfort === 'It depended on their mood')
    pattern.push('Comfort that depended on mood taught you that affection must be earned. So you over-give, over-explain, over-apologize — and call it love.');

  // pulls away insight
  const pull = answers.he_pulls_away;
  if (pull === 'Move closer, text more')
    pattern.push('When he pulls away, you accelerate. Your report flags this as your single most expensive reflex — pursuit is the moment good men start feeling crowded and wrong men start feeling powerful.');
  else if (pull === 'Match his distance')
    pattern.push('When he pulls away, you vanish too. Two people protecting themselves creates one thing: distance squared. Somebody has to break the symmetry — your report shows you how, without losing dignity.');
  else if (pull === 'Overthink every word I said')
    pattern.push('The 2 a.m. replays aren’t analysis — they’re self-blame in a loop. The right man will make his interest boringly obvious. That’s the standard now.');

  // exes insight
  const exes = answers.exes_pattern;
  if (exes === 'They were emotionally unavailable')
    pattern.push('Line your exes up and you see it: different faces, same wall. You don’t have bad luck with unavailable men — you have a homing instinct for them. It was installed long before any of them arrived.');
  else if (exes === 'Intense at first, then cold')
    pattern.push('The intense-then-cold cycle you described has a name: intermittent reinforcement — the most addictive reward schedule known to psychology. You weren’t weak. You were hooked by design.');
  else if (exes === 'I lost myself in them')
    pattern.push('You wrote that you lose yourself in relationships. A woman who merges can’t be chosen — there’s no one distinct left to choose. Your report rebuilds the self that makes choosing possible.');

  const fatherWound = FATHER_WOUNDS[answers.father_figure] ?? FATHER_WOUNDS['Present, but emotionally unavailable'];

  const path = [
    {
      title: 'Weeks 1–2 · Pattern Detox',
      text:
        style === 'avoidant'
          ? 'You stop rewarding your own distance. Two concrete scripts for staying present when every instinct says withdraw — including the 48-hour rule for when you want to ghost.'
          : 'You break the reflex that costs you the most. One rule — the 24-hour pause before pursuit — rewires the dynamic with every man currently in your orbit.',
    },
    {
      title: 'Weeks 3–6 · The Filter',
      text: `You date with the ${style === 'anxious' ? 'Consistency Test' : style === 'avoidant' ? 'Warmth Audit' : 'Calm Standard'}: a 5-signal checklist that separates marriage-minded men from charming tenants of your time — within three dates, not three years.`,
    },
    {
      title: 'Weeks 7–12 · Toward the Ring',
      text: `You learn the conversation most women never have: how to speak about marriage and children in month two — in a way that makes the right man lean in, not leave. This is where ${zodiac ? `a ${zodiac.element} sign like you` : 'a woman like you'} stops hoping and starts choosing.`,
    },
  ];

  return {
    name,
    zodiac,
    age,
    style,
    styleName: meta.name,
    headline: meta.headline,
    subheadline: meta.sub,
    pattern,
    fatherWound,
    realReason: REAL_REASONS[style],
    herWords: answers.own_words?.trim() || null,
    manSheNeeds: MAN_NEEDS[style],
    path,
  };
}

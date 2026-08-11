import type { Answers } from './lib/engine';
import type { DeepReport } from './components/Report';

export const SAMPLE_ANSWERS: Answers = {
  name: 'Sofia',
  email: 'sofia@example.com',
  dob: '1991-11-08',
  phone: '+39 333 123 4567',
  single_duration: '3 – 5 years',
  home_climate: 'Loving, but unpredictable',
  father_figure: 'Present, but emotionally unavailable',
  mother_love: 'Earned by being good',
  child_comfort: 'I learned not to ask',
  breakup_pattern: 'They left me',
  exes_pattern: 'They were emotionally unavailable',
  last_lesson: 'I give too much',
  he_pulls_away: 'Move closer, text more',
  conflict_style: 'Over-apologize to end it fast',
  falling_style: 'Fast and hard',
  marriage_timeline: '1 – 2 years',
  children_dream: 'I dream of it constantly',
  own_words: 'I keep choosing men who need fixing. Maybe I\'m too much, or maybe I just have terrible luck.',
};

export const SAMPLE_DEEP: DeepReport = {
  archetype: 'The Lighthouse Keeper',
  archetypeLine: 'You shine for everyone lost at sea — and forget you are allowed to be reached.',
  headline: 'You don\'t have bad luck, Sofia. You have a job you never applied for.',
  hook: 'Sofia, what you\'re doing — choosing men who need fixing so you never have to be chosen — is exactly what keeps love just out of reach, and here\'s why.',
  openingLetter: `Dear Sofia,

You wrote that you keep choosing men who need fixing. I want to stop you there, because that's not quite what your answers say. Your answers say you keep choosing men who let you *work*. There's a difference, and it matters more than you think.

When you told us that as a child you "learned not to ask" for comfort — and that your mother taught you love is "earned by being good" — you handed us the key to the whole pattern. A little girl in an unpredictable home, with a father who was present but unreachable, learns one survival rule above all: *if I am useful, I won't be left.* So she becomes good. She becomes the one who gives, who smooths, who fixes. And she grows into a woman who calls that love.

Here's the thread you haven't connected yet: you told us your relationships end with "they left me," and that when a man pulls away you "move closer, text more." Watch those two answers together. You don't get left because you're too much. You get left because you train men to receive without ever having to reach for you — and a man who never has to reach eventually stops valuing what arrives on its own.

The terrible luck you mentioned isn't luck. It's selection. You are drawn to men who need fixing not despite your pattern but because of it — they're the only ones who let you play the role you were raised to play. The good news is that roles can be rewritten. That's what the rest of this report is for.`,

  corePattern: `Your loop is remarkably consistent, and it runs like this: you meet someone, and within weeks you're "fast and hard" — your words — all in. Not because he's earned it, but because your nervous system reads early intensity as safety. So you over-give: you anticipate his needs, you absorb his moods, you make yourself indispensable. It feels like love. It's actually the little girl being good.

Then he pulls away — they always do, partly because you've removed all the reaching from the relationship. And here your second reflex fires: you move closer. You text more. You over-apologize in conflict to end it fast, because silence feels like the unpredictable house you grew up in, and you'd rather be wrong than be in that silence.

The man experiences this as pressure wrapped in kindness. He can't name it, but he feels managed. So he drifts further. You pursue harder. And eventually he leaves — confirming the story you already believed: *I give too much and it's never enough.* But look closer, Sofia. The amount was never the problem. The *direction* was. You give across a gap you're too afraid to let him cross.`,

  rootCause: `Let's go to the beginning, because that's where this was written. You described your home as "loving, but unpredictable." Those four words are doing enormous work. A child in an unpredictable home becomes a world-class reader of rooms — she learns to scan faces, measure tones, and adjust herself before the weather changes. That's a survival skill. It made you safe then. It exhausts you now.

Your father was "present, but emotionally unavailable." This is one of the most consequential combinations we see, because it creates a specific hunger: he was *there*, so you never doubted you should be loved — but he was unreachable, so you never felt *met*. A girl with that father doesn't conclude "men can't love me." She concludes something more painful: "men love me a little, and if I just find the right combination of goodness, I'll finally get the rest." You've been searching for that combination ever since. Every emotionally unavailable ex wasn't a coincidence or bad luck. He was your father's face, offering you another chance to finally win the reaching.

And your mother taught you love is "earned by being good." So you never learned to receive. You learned to *qualify*. That's why you learned not to ask for comfort — asking meant risking the answer "not now," and "not now" felt like "not you." It was safer to need nothing. The woman who needs nothing, Sofia, is very easy to leave, because she never asks anyone to stay.`,

  hiddenTruth: `Between your lines, something you didn't say: you wrote "maybe I'm too much." But your answers describe a woman who has spent her life being exactly the right amount — the right amount of good, of useful, of low-maintenance. You don't actually believe you're too much. You believe you're *not enough* — and "too much" is just the more flattering story. The truth is the opposite of both: you have never once let a man see how much you actually need. That's the thing you're protecting. And it's the very thing that would make the right man stay.`,

  herWordsReflected: `You wrote: "I keep choosing men who need fixing. Maybe I'm too much, or maybe I just have terrible luck." Read that back as if your closest friend wrote it. Would you tell her she has bad luck — or would you gently point out that she keeps volunteering for a job that breaks her heart, then blaming herself when it does? You're not too much, and it's not luck. It's a pattern with a beginning, which means it can have an end.`,

  manSheNeeds: [
    'Consistent in the boring moments — a man whose Tuesday texts match his Saturday ones, because your nervous system needs predictability more than it needs fireworks',
    'A reacher, not a receiver — someone who notices when you go quiet and comes toward you, so you finally learn what it feels like to be pursued instead of to pursue',
    'Direct about the future early — he says "I want a family" by month two without flinching, because your 1–2 year timeline and your dream of children deserve a man who matches them out loud',
    'Unimpressed by your usefulness — the man who loves you most when you\'re doing nothing for him, because that\'s the only love that will ever feel safe to a woman raised on earning it',
  ],

  ninetyDayPath: [
    {
      title: 'Weeks 1–2 · The Receiving Muscle',
      text: 'Before you change who you date, you change what you allow. Your only assignment: when someone offers you anything — help, a compliment, a kind text — you say "thank you" and stop. No returning it, no earning it, no deflecting. It will feel unbearable for about ten days. That discomfort is the pattern loosening.',
    },
    {
      title: 'Weeks 3–6 · The Pull-Away Pause',
      text: 'Your reflex when he withdraws is to move closer. For these weeks, you run one rule: when a man goes quiet, you do nothing for 24 hours. Not as a game — as information. The man who reappears and reaches for you passes. The man who vanishes just saved you six months. You are no longer closing gaps; you\'re watching who crosses them.',
    },
    {
      title: 'Weeks 7–12 · The Out-Loud Ask',
      text: 'You told us you dream of children constantly and want marriage within 1–2 years. So you stop treating that as a secret to protect. By the second or third date with anyone promising, you say it plainly: "I\'m dating for marriage and a family." The wrong men will excuse themselves — let them, gratefully. The right man will lean in. That\'s the whole test.',
    },
  ],

  closingLine: 'The family you dream about is not behind you and it is not too late — it is waiting for the version of you who finally lets herself be reached.',
};

import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { purchases } from '../../db/schema';
import { createRouter, publicQuery } from '../middleware';
import { getDb } from './connection';

const answerSchema = z.object({
  token: z.string().min(8).max(64),
  name: z.string().max(120),
  email: z.string().max(190).optional(),
  age: z.number().int().min(16).max(100).optional(),
  zodiac: z.string().max(30).optional(),
  single_duration: z.string().max(300).optional(),
  home_climate: z.string().max(300).optional(),
  father_figure: z.string().max(300).optional(),
  mother_love: z.string().max(300).optional(),
  child_comfort: z.string().max(300).optional(),
  breakup_pattern: z.string().max(300).optional(),
  exes_pattern: z.string().max(300).optional(),
  last_lesson: z.string().max(300).optional(),
  he_pulls_away: z.string().max(300).optional(),
  conflict_style: z.string().max(300).optional(),
  falling_style: z.string().max(300).optional(),
  marriage_timeline: z.string().max(300).optional(),
  children_dream: z.string().max(300).optional(),
  own_words: z.string().max(2000).optional(),
});

export interface GeneratedReport {
  archetype: string;
  archetypeLine: string;
  headline: string;
  hook: string;
  openingLetter: string;
  corePattern: string;
  rootCause: string;
  hiddenTruth: string;
  herWordsReflected: string;
  manSheNeeds: string[];
  ninetyDayPath: { title: string; text: string }[];
  fieldGuide: {
    scripts: { situation: string; sayThis: string; notThis: string }[];
    greenFlags: string[];
    redFlags: string[];
  } | null;
  closingLine: string;
}

const SYSTEM_PROMPT = `You write personalized educational relationship-pattern reflections for Revela. You are warm, observant, specific, and practical. You do not claim to be a psychologist, clinician, therapist, or medical professional. You never diagnose, predict a relationship outcome, shame the reader, or present an imagined childhood scene as fact. Distinguish observations from possibilities using language such as "may", "might", and "your answers suggest". Every useful claim must connect to an answer the reader actually gave. Translate ideas into observable behavior, exact language, and small actions.`;

function buildPrompt(input: z.infer<typeof answerSchema>): string {
  return `Create a premium Revela Secure Love Reset for the person below. Use her answers closely, but do not invent facts. The purpose is educational self-reflection and practical relationship decision support.

ANSWERS
- Name: ${input.name}
- Age: ${input.age ?? 'not provided'}
- Time single: ${input.single_duration ?? 'not provided'}
- Childhood home climate: ${input.home_climate ?? 'not provided'}
- Father or father-figure experience: ${input.father_figure ?? 'not provided'}
- Comfort as a child: ${input.child_comfort ?? 'not provided'}
- Common breakup pattern: ${input.breakup_pattern ?? 'not provided'}
- Pattern across previous partners: ${input.exes_pattern ?? 'not provided'}
- Response when someone pulls away: ${input.he_pulls_away ?? 'not provided'}
- Conflict response: ${input.conflict_style ?? 'not provided'}
- How attraction develops: ${input.falling_style ?? 'not provided'}
- Preferred marriage timeline: ${input.marriage_timeline ?? 'not provided'}
- Feelings about children: ${input.children_dream ?? 'not provided'}
- Her own explanation for being single: ${input.own_words ?? 'not provided'}

Return ONLY valid JSON with exactly this structure:
{
  "archetype": "specific 2-4 word pattern name",
  "archetypeLine": "one precise sentence defining it",
  "headline": "one memorable, compassionate headline",
  "hook": "one direct sentence naming the central pattern, maximum 32 words",
  "openingLetter": "3 paragraphs, 180-240 words total. Reflect the strongest connection among her answers without claiming certainty.",
  "corePattern": "3 paragraphs, 220-280 words total. Explain the sequence from attraction to uncertainty to response to outcome. Include one plausible example clearly labeled as an example, not a memory.",
  "rootCause": "2-3 paragraphs, 180-240 words total. Connect childhood answers to present protection strategies using tentative, non-diagnostic language.",
  "hiddenTruth": "2 short paragraphs, 120-170 words total. Give one sharp but compassionate blind spot and explain why it is changeable.",
  "herWordsReflected": "one short paragraph quoting or closely reflecting her own explanation, then reframing it compassionately",
  "manSheNeeds": ["exactly 4 concrete traits. Each 35-55 words and tied to observable behavior"],
  "ninetyDayPath": [
    {"title":"Weeks 1-2 · <phase name>","text":"65-90 words with one exact sentence to use"},
    {"title":"Weeks 3-6 · <phase name>","text":"65-90 words with one observable green flag and one red flag"},
    {"title":"Weeks 7-12 · <phase name>","text":"65-90 words with one conversation to initiate and when"}
  ],
  "fieldGuide": {
    "scripts": [
      {"situation":"specific trigger","sayThis":"one natural sentence","notThis":"the reactive alternative to avoid"},
      {"situation":"specific trigger","sayThis":"one natural sentence","notThis":"the reactive alternative to avoid"},
      {"situation":"specific trigger","sayThis":"one natural sentence","notThis":"the reactive alternative to avoid"}
    ],
    "greenFlags": ["4 observable early signs, 15-25 words each"],
    "redFlags": ["4 observable early signs, 15-25 words each"]
  },
  "closingLine": "one grounded, hopeful line without promising a partner or marriage"
}

RULES
- Valid JSON only. No markdown or commentary.
- Target 1,150-1,500 words total so the JSON completes within the output limit.
- Never mention astrology, zodiac, diagnosis, attachment-style labels as identity, therapy credentials, or guaranteed outcomes.
- Do not say you know something she did not tell you.
- Do not describe imagined scenes as memories or facts.
- If an answer is missing, omit that detail rather than inventing it.
- Make the scripts usable word-for-word and the flags observable on real dates or during real communication.`;
}

type Failure = { ok: false; reason: string; httpStatus?: number; detail?: string };
type Success = { ok: true; report: GeneratedReport; provider: string };
type ProviderResult = Success | Failure;

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join('\n\n').trim();
  return '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => asString(item)).filter(Boolean)
    : [];
}

function normalize(raw: unknown): GeneratedReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const path = Array.isArray(value.ninetyDayPath)
    ? value.ninetyDayPath
        .map((item) => {
          const phase = (item ?? {}) as Record<string, unknown>;
          return { title: asString(phase.title), text: asString(phase.text) };
        })
        .filter((item) => item.title && item.text)
        .slice(0, 3)
    : [];

  const field = value.fieldGuide && typeof value.fieldGuide === 'object'
    ? (value.fieldGuide as Record<string, unknown>)
    : null;
  const scripts = Array.isArray(field?.scripts)
    ? field.scripts
        .map((item) => {
          const script = (item ?? {}) as Record<string, unknown>;
          return {
            situation: asString(script.situation),
            sayThis: asString(script.sayThis),
            notThis: asString(script.notThis),
          };
        })
        .filter((item) => item.situation && item.sayThis)
        .slice(0, 3)
    : [];
  const greenFlags = asStringArray(field?.greenFlags).slice(0, 4);
  const redFlags = asStringArray(field?.redFlags).slice(0, 4);

  const report: GeneratedReport = {
    archetype: asString(value.archetype) || 'The Hidden Pattern',
    archetypeLine: asString(value.archetypeLine),
    headline: asString(value.headline),
    hook: asString(value.hook),
    openingLetter: asString(value.openingLetter),
    corePattern: asString(value.corePattern),
    rootCause: asString(value.rootCause),
    hiddenTruth: asString(value.hiddenTruth),
    herWordsReflected: asString(value.herWordsReflected),
    manSheNeeds: asStringArray(value.manSheNeeds).slice(0, 4),
    ninetyDayPath: path,
    fieldGuide:
      scripts.length || greenFlags.length || redFlags.length
        ? { scripts, greenFlags, redFlags }
        : null,
    closingLine: asString(value.closingLine),
  };

  if (!report.openingLetter || !report.corePattern || !report.rootCause || path.length !== 3) return null;
  return report;
}

function parseJson(raw: string): GeneratedReport | null {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const candidates = [cleaned];
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(cleaned.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      const normalized = normalize(JSON.parse(candidate));
      if (normalized) return normalized;
    } catch {
      // Try the next extraction candidate.
    }
  }
  return null;
}

function errorDetail(raw: string): string {
  try {
    return String((JSON.parse(raw) as { error?: { message?: string } }).error?.message ?? '').slice(0, 200);
  } catch {
    return raw.slice(0, 200);
  }
}

async function moonshot(input: z.infer<typeof answerSchema>): Promise<ProviderResult> {
  const key = process.env.MOONSHOT_API_KEY;
  if (!key) return { ok: false, reason: 'no_key' };
  try {
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.MOONSHOT_MODEL || 'moonshot-v1-32k',
        temperature: 0.55,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(input) },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    const raw = await response.text();
    if (!response.ok) return { ok: false, reason: 'api_error', httpStatus: response.status, detail: errorDetail(raw) };
    const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
    const report = parseJson(data.choices?.[0]?.message?.content ?? '');
    return report ? { ok: true, report, provider: 'moonshot' } : { ok: false, reason: 'parse_error' };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'error' };
  }
}

async function claude(input: z.infer<typeof answerSchema>): Promise<ProviderResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: 'no_key' };
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: 4096,
        temperature: 0.55,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(input) }],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    const raw = await response.text();
    if (!response.ok) return { ok: false, reason: 'api_error', httpStatus: response.status, detail: errorDetail(raw) };
    const data = JSON.parse(raw) as { content?: { type?: string; text?: string }[] };
    const text = data.content?.find((item) => item.type === 'text')?.text ?? '';
    const report = parseJson(text);
    return report ? { ok: true, report, provider: 'claude' } : { ok: false, reason: 'parse_error' };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'error' };
  }
}

export const reportRouter = createRouter({
  generate: publicQuery.input(answerSchema).mutation(async ({ input }) => {
    const db = getDb();
    const [purchase] = await db
      .select({ status: purchases.status, reportJson: purchases.reportJson, reportProvider: purchases.reportProvider })
      .from(purchases)
      .where(eq(purchases.sessionToken, input.token))
      .limit(1);
    if (purchase?.status !== 'paid') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Paid access is required for this generation.' });
    }
    if (purchase.reportJson) {
      try {
        const cached = normalize(JSON.parse(purchase.reportJson));
        if (cached) return { ok: true as const, report: cached, provider: purchase.reportProvider || 'cache' };
      } catch {
        // A malformed cache is ignored and replaced by a fresh valid generation.
      }
    }

    const failures: Failure[] = [];
    for (const [name, provider] of [
      ['moonshot', moonshot],
      ['claude', claude],
    ] as const) {
      const result = await provider(input);
      if (result.ok) {
        await db
          .update(purchases)
          .set({
            reportJson: JSON.stringify(result.report),
            reportProvider: result.provider,
            reportGeneratedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(purchases.sessionToken, input.token));
        return result;
      }
      const failure = result as Failure;
      failures.push(failure);
      if (failure.reason !== 'no_key') {
        console.error(`Premium report provider ${name} failed`, failure.reason, failure.httpStatus ?? '', failure.detail ?? '');
      }
    }

    const meaningful = failures.find((failure) => failure.reason !== 'no_key') ?? failures[0];
    return {
      ok: false as const,
      reason: meaningful?.reason ?? 'all_providers_unavailable',
      httpStatus: meaningful?.httpStatus,
      detail: meaningful?.detail,
    };
  }),
});

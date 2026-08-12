import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";

// ─────────────────────────────────────────────────────────────
// AI-powered deep report generation with a provider chain:
//   1. Moonshot  (MOONSHOT_API_KEY)
//   2. Claude    (ANTHROPIC_API_KEY)  ← backup
// Keys live in .env and never touch the client. If every
// provider fails, the client falls back to the built-in
// generator, so a visitor always gets a report.
// ─────────────────────────────────────────────────────────────

const answerSchema = z.object({
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

export interface ClaudeReport {
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
  closingLine: string;
}

const SYSTEM_PROMPT = `You are the lead relationship psychologist at Revela Institute — a clinician with 20 years specializing in female attachment patterns, father-daughter imprints, and commitment dynamics. You write reports that women describe as "someone finally saw me." Your voice: warm, precise, unflinching but loving — a brilliant older sister with a PhD. Never clinical jargon without translation. Never generic advice. Every sentence must feel written FOR THIS SPECIFIC WOMAN, referencing her actual answers by content. You are insightful, not flattering; kind, not soft. You never shame her. You always leave her with hope and a concrete next move.`;

function buildUserPrompt(a: z.infer<typeof answerSchema>): string {
  return `Write the Revela Deep Reading for this woman. Below are her actual answers to our 21-question assessment. Use them obsessively — quote her own words back to her where it lands hardest.

HER ANSWERS:
- Name: ${a.name}
- Age: ${a.age ?? "unknown"}
- Zodiac (for texture only, do NOT base analysis on it): ${a.zodiac ?? "unknown"}
- How long single: ${a.single_duration ?? "—"}
- Childhood home felt: ${a.home_climate ?? "—"}
- Father figure was: ${a.father_figure ?? "—"}
- Mother taught her love is: ${a.mother_love ?? "—"}
- As a child needing comfort: ${a.child_comfort ?? "—"}
- Past relationships usually ended because: ${a.breakup_pattern ?? "—"}
- Lining up her exes, she notices: ${a.exes_pattern ?? "—"}
- Her last relationship taught her (her words): "${a.last_lesson ?? "—"}"
- When a man pulls away, she: ${a.he_pulls_away ?? "—"}
- In conflict she tends to: ${a.conflict_style ?? "—"}
- She falls for someone: ${a.falling_style ?? "—"}
- Marriage timeline if she met the right man: ${a.marriage_timeline ?? "—"}
- On children: ${a.children_dream ?? "—"}
- WHY SHE THINKS SHE'S STILL SINGLE (her own words — the most important answer): "${a.own_words ?? "—"}"

STRUCTURE YOUR RESPONSE AS EXACTLY THIS JSON (valid JSON only, no markdown, no preamble):

{
  "archetype": "A 2-4 word archetype name (e.g. 'The Over-Giver', 'The Fortress') that fits HER specifically",
  "archetypeLine": "One sentence definition of this archetype, poetic but precise",
  "headline": "A one-line headline for her report that feels like it was written only for her",
  "hook": "ONE sentence — the first sentence of her report, shown unblurred. Direct, personal, slightly confrontational but loving: name WHAT SHE IS DOING WRONG in her own terms, then promise the explanation. Pattern: '<Name>, what you're doing — <her core pattern, drawn from her exes/pulling-away/conflict answers> — is exactly what <the cost>, and here's why.' Max 35 words. No asterisks, no quotes.",
  "openingLetter": "3-4 paragraphs. Address her by name. Open by reflecting something TRUE from her answers that she probably hasn't connected yet — a thread between her childhood answer and her current pattern. Make her feel seen in the first two sentences. Reference her own words from 'why she thinks she's single' — and gently show her that the real reason is different from what she wrote.",
  "corePattern": "2-3 paragraphs naming her exact recurring pattern — the loop she runs from first date to ending. Be specific using her answers about pulling away, conflict, and her exes. Show the mechanism: what she does, what the man experiences, how it ends.",
  "rootCause": "2-3 paragraphs tracing it to the root — her father figure answer, her home climate, her comfort answer. Connect the dots she hasn't connected. This is the section that makes women cry: show her the little girl's logic that still runs her love life today.",
  "hiddenTruth": "1-2 paragraphs. The thing she didn't say but revealed between the lines. One sharp, loving insight she will screenshot.",
  "herWordsReflected": "1 short paragraph quoting her own words about why she's single, then reframing them with compassion.",
  "manSheNeeds": ["Exactly 4 bullet strings describing the man who would actually work for her — each one specific to her pattern, each one starting differently, each one a concrete trait + why it matters FOR HER"],
  "ninetyDayPath": [
    { "title": "Weeks 1–2 · <short phase name like 'The Boundary Reset'>", "text": "2-3 sentences: the first concrete move, specific to her pattern" },
    { "title": "Weeks 3–6 · <short phase name like 'The Filtering Phase'>", "text": "2-3 sentences: the filtering/dating phase, specific to her pattern" },
    { "title": "Weeks 7–12 · <short phase name like 'The Commitment Window'>", "text": "2-3 sentences: the commitment phase, specific to her timeline and children answer" }
  ],
  "closingLine": "One final line she will remember. Warm, direct, about the future that is still available to her."
}

RULES:
- Output ONLY the JSON object. No code fences, no commentary.
- Every paragraph must reference her specific answers — if a sentence could apply to any woman, rewrite it until it could only apply to her.
- Use her name naturally (1-2 times total, not in every paragraph) and NEVER inside a ninetyDayPath title — those titles are phase names only.
- NEVER mention her zodiac sign or astrology anywhere in the report — no "as a Scorpio", no star references. Her sign is shown separately in the page header; the analysis must be purely psychological.
- Never diagnose or use clinical labels as identity ("you have anxious attachment" → "your nervous system learned to...").
- Total length: substantial — this is a premium report. Aim for depth over brevity.`;
}

type GenResult =
  | { ok: true; report: ClaudeReport; provider: string }
  | { ok: false; reason: string; httpStatus?: number; detail?: string };

// AI output is untrusted — models sometimes return arrays or objects where a
// string is expected. Coerce everything into the exact shapes the client
// renders, or the report page crashes on a `.split` of a non-string.
function normalizeReport(raw: unknown): ClaudeReport | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown): string =>
    typeof v === "string"
      ? v
      : Array.isArray(v)
        ? v.filter((x) => typeof x === "string").join("\n\n")
        : "";
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : "")).filter(Boolean) : [];
  const path = Array.isArray(o.ninetyDayPath)
    ? (o.ninetyDayPath as unknown[])
        .map((p) => {
          const pp = (p ?? {}) as Record<string, unknown>;
          return { title: str(pp.title), text: str(pp.text) };
        })
        .filter((p) => p.title || p.text)
    : [];
  const report: ClaudeReport = {
    archetype: str(o.archetype) || "The Hidden Pattern",
    archetypeLine: str(o.archetypeLine),
    headline: str(o.headline),
    hook: str(o.hook),
    openingLetter: str(o.openingLetter),
    corePattern: str(o.corePattern),
    rootCause: str(o.rootCause),
    hiddenTruth: str(o.hiddenTruth),
    herWordsReflected: str(o.herWordsReflected),
    manSheNeeds: strArr(o.manSheNeeds).slice(0, 6),
    ninetyDayPath: path,
    closingLine: str(o.closingLine),
  };
  if (!report.openingLetter && !report.corePattern) return null;
  return report;
}

function parseReport(raw: string): ClaudeReport | null {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return normalizeReport(JSON.parse(clean.slice(start, end + 1)));
  } catch {
    return null;
  }
}

async function tryMoonshot(input: z.infer<typeof answerSchema>): Promise<GenResult> {
  const key = process.env.MOONSHOT_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };
  try {
    const res = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-32k",
        temperature: 0.8,
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("Moonshot API error", res.status, txt.slice(0, 500));
      let detail = "";
      try {
        detail = (JSON.parse(txt) as { error?: { message?: string } })?.error?.message ?? "";
      } catch { /* ignore */ }
      return { ok: false, reason: "api_error", httpStatus: res.status, detail: detail.slice(0, 200) };
    }
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const report = parseReport(data.choices?.[0]?.message?.content ?? "");
    if (!report) return { ok: false, reason: "parse_error" };
    return { ok: true, report, provider: "moonshot" };
  } catch (e) {
    console.error("Moonshot generation failed", e);
    return { ok: false, reason: "error" };
  }
}

async function tryClaude(input: z.infer<typeof answerSchema>): Promise<GenResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(input) }],
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("Claude API error", res.status, txt.slice(0, 500));
      let detail = "";
      try {
        detail = (JSON.parse(txt) as { error?: { message?: string } })?.error?.message ?? "";
      } catch { /* ignore */ }
      return { ok: false, reason: "api_error", httpStatus: res.status, detail: detail.slice(0, 200) };
    }
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    const raw = data.content?.find((b) => b.type === "text")?.text ?? "";
    const report = parseReport(raw);
    if (!report) return { ok: false, reason: "parse_error" };
    return { ok: true, report, provider: "claude" };
  } catch (e) {
    console.error("Claude generation failed", e);
    return { ok: false, reason: "error" };
  }
}

// ── Mid-quiz revelation: a real AI insight after the first 5 answers ──
const revelationSchema = z.object({
  name: z.string().max(120),
  single_duration: z.string().max(300).optional(),
  home_climate: z.string().max(300).optional(),
  father_figure: z.string().max(300).optional(),
  mother_love: z.string().max(300).optional(),
  child_comfort: z.string().max(300).optional(),
});

function buildRevelationPrompt(a: z.infer<typeof revelationSchema>): string {
  return `A woman named ${a.name} is taking your relationship-pattern assessment. She has just answered the first five questions:

- How long single: ${a.single_duration ?? "—"}
- Childhood home felt: ${a.home_climate ?? "—"}
- Father figure was: ${a.father_figure ?? "—"}
- Mother taught her love is: ${a.mother_love ?? "—"}
- As a child needing comfort: ${a.child_comfort ?? "—"}

Write ONE short mid-quiz revelation for her (2-3 sentences, max 60 words). It must:
- Connect at least two of her ACTUAL answers above into one sharp, loving insight she hasn't seen herself — e.g. a thread between her childhood home and her current love life.
- Address her by name once, naturally.
- Feel uncanny, not generic — if the sentence could apply to any woman, rewrite it.
- End with forward motion ("keep going", "the next questions will show you…") — no questions back to her.
- Plain text only. No quotes, no asterisks, no preamble.`;
}

type RevResult = { ok: true; text: string; provider: string } | { ok: false; reason: string };

async function tryMoonshotRevelation(input: z.infer<typeof revelationSchema>): Promise<RevResult> {
  const key = process.env.MOONSHOT_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };
  try {
    const res = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "moonshot-v1-32k",
        temperature: 0.9,
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildRevelationPrompt(input) },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { ok: false, reason: "api_error" };
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const text = (data.choices?.[0]?.message?.content ?? "").trim().replace(/^["“]|["”]$/g, "");
    if (text.length < 20) return { ok: false, reason: "empty" };
    return { ok: true, text, provider: "moonshot" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

async function tryClaudeRevelation(input: z.infer<typeof revelationSchema>): Promise<RevResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 220,
        temperature: 0.9,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildRevelationPrompt(input) }],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { ok: false, reason: "api_error" };
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    const text = (data.content?.find((b) => b.type === "text")?.text ?? "").trim().replace(/^["“]|["”]$/g, "");
    if (text.length < 20) return { ok: false, reason: "empty" };
    return { ok: true, text, provider: "claude" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export const reportRouter = createRouter({
  hasClaude: publicQuery.query(() => ({
    enabled: !!(process.env.MOONSHOT_API_KEY || process.env.ANTHROPIC_API_KEY),
  })),

  revelation: publicQuery.input(revelationSchema).mutation(async ({ input }) => {
    for (const fn of [tryMoonshotRevelation, tryClaudeRevelation]) {
      const r = await fn(input);
      if (r.ok) return r;
      if (r.reason !== "no_key") console.error("Revelation provider failed:", r.reason);
    }
    return { ok: false as const, reason: "all_providers_failed" };
  }),

  generate: publicQuery.input(answerSchema).mutation(async ({ input }) => {
    // provider chain: Moonshot → Claude
    const attempts: { name: string; result: GenResult }[] = [];
    for (const [name, fn] of [["moonshot", tryMoonshot], ["claude", tryClaude]] as const) {
      const result = await fn(input);
      attempts.push({ name, result });
      if (result.ok) {
        return { ok: true as const, report: result.report, provider: result.provider };
      }
      // a missing key means "not configured" — skip silently; a real API error is worth logging
      if (result.reason !== "no_key") {
        console.error(`Provider ${name} failed:`, result.reason, result.httpStatus ?? "", result.detail ?? "");
      }
    }
    const failed = attempts
      .map((a) => a.result)
      .filter((r): r is Extract<GenResult, { ok: false }> => !r.ok);
    const first = failed.find((r) => r.reason !== "no_key") ?? failed[0];
    return {
      ok: false as const,
      reason: first?.reason ?? ("error" as const),
      httpStatus: first?.httpStatus,
      detail: first?.detail,
    };
  }),
});

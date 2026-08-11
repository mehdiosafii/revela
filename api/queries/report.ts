import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";

// ─────────────────────────────────────────────────────────────
// Claude-powered deep report generation.
// Set CLAUDE_API_KEY in .env (recommended) — the key never
// touches the client. If unset, the client falls back to the
// built-in generator.
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
  "openingLetter": "3-4 paragraphs. Address her by name. Open by reflecting something TRUE from her answers that she probably hasn't connected yet — a thread between her childhood answer and her current pattern. Make her feel seen in the first two sentences. Reference her own words from 'why she thinks she's single' — and gently show her that the real reason is different from what she wrote.",
  "corePattern": "2-3 paragraphs naming her exact recurring pattern — the loop she runs from first date to ending. Be specific using her answers about pulling away, conflict, and her exes. Show the mechanism: what she does, what the man experiences, how it ends.",
  "rootCause": "2-3 paragraphs tracing it to the root — her father figure answer, her home climate, her comfort answer. Connect the dots she hasn't connected. This is the section that makes women cry: show her the little girl's logic that still runs her love life today.",
  "hiddenTruth": "1-2 paragraphs. The thing she didn't say but revealed between the lines. One sharp, loving insight she will screenshot.",
  "herWordsReflected": "1 short paragraph quoting her own words about why she's single, then reframing them with compassion.",
  "manSheNeeds": ["Exactly 4 bullet strings describing the man who would actually work for her — each one specific to her pattern, each one starting differently, each one a concrete trait + why it matters FOR HER"],
  "ninetyDayPath": [
    { "title": "Weeks 1–2 · <name>", "text": "2-3 sentences: the first concrete move, specific to her pattern" },
    { "title": "Weeks 3–6 · <name>", "text": "2-3 sentences: the filtering/dating phase, specific to her pattern" },
    { "title": "Weeks 7–12 · <name>", "text": "2-3 sentences: the commitment phase, specific to her timeline and children answer" }
  ],
  "closingLine": "One final line she will remember. Warm, direct, about the future that is still available to her."
}

RULES:
- Output ONLY the JSON object. No code fences, no commentary.
- Every paragraph must reference her specific answers — if a sentence could apply to any woman, rewrite it until it could only apply to her.
- Use her name naturally (1-2 times total, not in every paragraph).
- Never mention astrology as analysis (she knows it's not used).
- Never diagnose or use clinical labels as identity ("you have anxious attachment" → "your nervous system learned to...").
- Total length: substantial — this is a premium report. Aim for depth over brevity.`;
}

export const reportRouter = createRouter({
  hasClaude: publicQuery.query(() => ({ enabled: !!process.env.CLAUDE_API_KEY })),

  generate: publicQuery.input(answerSchema).mutation(async ({ input }) => {
    const key = process.env.CLAUDE_API_KEY;
    if (!key) {
      return { ok: false as const, reason: "no_key" as const };
    }
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
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(input) }],
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Claude API error", res.status, txt.slice(0, 500));
        return { ok: false as const, reason: "api_error" as const };
      }
      const data = (await res.json()) as { content: { type: string; text: string }[] };
      const raw = data.content?.find((c) => c.type === "text")?.text ?? "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean) as ClaudeReport;
      return { ok: true as const, report: parsed };
    } catch (e) {
      console.error("Claude generation failed", e);
      return { ok: false as const, reason: "error" as const };
    }
  }),
});

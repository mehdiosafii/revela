import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { TRPCError } from "@trpc/server";
import { env } from "../lib/env";

/**
 * Personalized report illustrations via Gemini image editing.
 * The visitor's photo is passed through in-memory only: request -> Gemini -> response.
 * It is never written to the database or any storage.
 */

const GEMINI_MODEL = "gemini-2.5-flash-image";

const STYLE =
  "Create a warm, tasteful, softly photorealistic editorial photograph. " +
  "Preserve the exact facial identity, skin tone, and features of the woman in the provided photo — she must be clearly recognizable. " +
  "Elegant modest styling, golden-hour light, gentle film grain, no text, no watermark, no logos.";

export const SCENES: { id: string; prompt: string; caption: string }[] = [
  {
    id: "children",
    prompt:
      "Show this woman a few years from now, laughing with her two young children in a bright sunlit kitchen on a weekend morning — flour on the counter, genuine joy.",
    caption: "The morning she stopped wondering if it would ever happen",
  },
  {
    id: "parents",
    prompt:
      "Show this woman warmly embracing her parents in a family living room — reconciliation, softness, an old weight visibly gone from her shoulders.",
    caption: "The embrace that closes the oldest chapter",
  },
  {
    id: "peace",
    prompt:
      "Show this woman alone and radiant, walking away from a dim, blurred background toward warm light in an elegant coat — calm, self-possessed, unhurried.",
    caption: "The walk away from the old pattern",
  },
  {
    id: "married",
    prompt:
      "Show this woman on her wedding day, radiant with happiness, in an elegant wedding dress holding a bouquet; her partner stands beside her turned slightly away in soft focus so she is the clear subject.",
    caption: "The day the pattern is only a story she tells",
  },
];

const dataUrlRe = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/;

async function generateScene(
  apiKey: string,
  mimeType: string,
  photoB64: string,
  prompt: string,
): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${STYLE}\n\n${prompt}` },
              { inline_data: { mime_type: mimeType, data: photoB64 } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(55000),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
    return null;
  }

  const data: any = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const img = part.inlineData ?? part.inline_data;
    if (img?.data) {
      const outMime = img.mimeType ?? img.mime_type ?? "image/png";
      return `data:${outMime};base64,${img.data}`;
    }
  }
  console.error("Gemini: no image part in response");
  return null;
}

export const illustrationsRouter = createRouter({
  generate: publicQuery
    .input(
      z.object({
        token: z.string().min(8).max(128),
        photo: z.string().max(9_000_000), // ~6.5MB binary as base64 data URL
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.geminiApiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Illustrations are not configured",
        });
      }
      const m = input.photo.match(dataUrlRe);
      if (!m) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid photo format" });
      }
      const mimeType = `image/${m[1] === "jpg" ? "jpeg" : m[1]}`;
      const photoB64 = m[2];

      const results = await Promise.allSettled(
        SCENES.map((s) => generateScene(env.geminiApiKey, mimeType, photoB64, s.prompt)),
      );

      const images = SCENES.map((s, i) => {
        const r = results[i];
        return {
          id: s.id,
          caption: s.caption,
          image: r.status === "fulfilled" ? r.value : null,
        };
      });

      // Photo intentionally not persisted anywhere — it lives only in this request.
      return { images };
    }),
});

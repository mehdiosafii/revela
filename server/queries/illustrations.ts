import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { purchases } from '../../db/schema';
import { env } from '../lib/env';
import { createRouter, publicQuery } from '../middleware';
import { getDb } from './connection';

const GEMINI_MODEL = 'gemini-2.5-flash-image';
const DATA_URL = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/;

const STYLE =
  'Create a warm, tasteful editorial photograph for a private self-reflection workbook. ' +
  'Preserve the recognizable facial identity, skin tone, and features of the woman in the provided photo. ' +
  'Elegant modest styling, natural light, subtle film grain, no text, watermark, logo, wedding imagery, pregnancy imagery, or implied prediction.';

const SCENES = [
  {
    id: 'parents',
    prompt:
      'Show this woman seated in a calm living room looking through an old family photo album with a thoughtful, grounded expression. The scene represents viewing the past with adult perspective, not a literal memory.',
    caption: 'Looking at the past with adult eyes',
  },
  {
    id: 'peace',
    prompt:
      'Show this woman walking outdoors in warm late-afternoon light, calm and self-possessed, leaving a softly blurred path behind her. The mood is clarity after an emotional decision.',
    caption: 'The pause between the trigger and the choice',
  },
  {
    id: 'children',
    prompt:
      'Show this woman at a sunlit table writing in a notebook titled only through visual implication, surrounded by ordinary signs of a full life such as books, flowers, and coffee. No visible text in the image.',
    caption: 'Building a life chosen deliberately',
  },
  {
    id: 'clarity',
    prompt:
      'Show this woman preparing for an evening out in an elegant mirror-lit room, composed and confident, checking in with herself before leaving. No partner, wedding dress, ring emphasis, or prediction.',
    caption: 'Choosing from clarity, not urgency',
  },
] as const;

async function requirePaidAccess(token: string) {
  const db = getDb();
  const [purchase] = await db
    .select({ status: purchases.status })
    .from(purchases)
    .where(eq(purchases.sessionToken, token))
    .limit(1);
  if (purchase?.status !== 'paid') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Paid access is required for illustrations.' });
  }
}

async function generateScene(apiKey: string, mimeType: string, photoBase64: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${STYLE}\n\n${prompt}` },
              { inline_data: { mime_type: mimeType, data: photoBase64 } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Gemini illustration error', response.status, detail.slice(0, 240));
    return null;
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }[] } }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const image = part.inlineData ?? part.inline_data;
    if (image?.data) {
      const outputMime = 'mimeType' in image ? image.mimeType : (image as { mime_type?: string }).mime_type;
      return `data:${outputMime || 'image/png'};base64,${image.data}`;
    }
  }
  return null;
}

export const illustrationsRouter = createRouter({
  generate: publicQuery
    .input(
      z.object({
        token: z.string().min(8).max(64),
        photo: z.string().max(4_500_000),
      }),
    )
    .mutation(async ({ input }) => {
      await requirePaidAccess(input.token);
      if (!env.geminiApiKey) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Optional illustrations are not configured.' });
      }

      const match = input.photo.match(DATA_URL);
      if (!match) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid photo format.' });
      const mimeType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
      const photoBase64 = match[2];

      const results = await Promise.allSettled(
        SCENES.map((scene) => generateScene(env.geminiApiKey, mimeType, photoBase64, scene.prompt)),
      );

      return {
        images: SCENES.map((scene, index) => {
          const result = results[index];
          return {
            id: scene.id,
            caption: scene.caption,
            image: result.status === 'fulfilled' ? result.value : null,
          };
        }),
      };
    }),
});

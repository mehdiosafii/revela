import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { answers, events, sessions } from '../../db/schema';
import { createRouter, publicQuery } from '../middleware';
import { getDb } from './connection';

const MAX_PHOTO_DATA_URL_LENGTH = 1_200_000;
const PHOTO_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

const trackInput = z.object({
  token: z.string().min(8).max(64),
  stage: z.enum(['landing', 'quiz', 'analyzing', 'report']).optional(),
  questionIndex: z.number().int().min(-1).max(200).optional(),
  questionId: z.string().max(64).optional(),
  durationMs: z.number().int().min(0).max(24 * 3600 * 1000).optional(),
  identity: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().max(190).optional(),
      phone: z.string().max(60).optional(),
    })
    .optional(),
});

function firstHeader(req: Request, name: string): string | null {
  const value = req.headers.get(name)?.trim();
  return value || null;
}

function requestMetadata(req: Request) {
  const forwarded = firstHeader(req, 'x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || firstHeader(req, 'x-real-ip');
  const country = firstHeader(req, 'x-vercel-ip-country');
  const rawCity = firstHeader(req, 'x-vercel-ip-city');
  let city = rawCity;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }
  return { ip, country, city, userAgent: firstHeader(req, 'user-agent') };
}

async function trackPing(input: z.infer<typeof trackInput>, req: Request) {
  const db = getDb();
  const now = new Date();
  const [existing] = await db
    .select({
      token: sessions.token,
      stage: sessions.stage,
      questionIndex: sessions.questionIndex,
      durationMs: sessions.durationMs,
      finishedAt: sessions.finishedAt,
    })
    .from(sessions)
    .where(eq(sessions.token, input.token))
    .limit(1);

  if (!existing) {
    const metadata = requestMetadata(req);
    await db
      .insert(sessions)
      .values({
        token: input.token,
        ...metadata,
        stage: input.stage ?? 'landing',
        questionIndex: input.questionIndex ?? -1,
        name: input.identity?.name,
        email: input.identity?.email,
        phone: input.identity?.phone,
        durationMs: input.durationMs ?? 0,
        completed: input.stage === 'report',
        finishedAt: input.stage === 'report' ? now : null,
        lastSeenAt: now,
      })
      .onConflictDoNothing({ target: sessions.token });
  } else {
    const patch: Partial<typeof sessions.$inferInsert> = {
      lastSeenAt: now,
      durationMs: Math.max(existing.durationMs, input.durationMs ?? 0),
    };
    if (input.stage) patch.stage = input.stage;
    if (input.questionIndex !== undefined) patch.questionIndex = input.questionIndex;
    if (input.identity?.name) patch.name = input.identity.name;
    if (input.identity?.email) patch.email = input.identity.email;
    if (input.identity?.phone) patch.phone = input.identity.phone;
    if (input.stage === 'report') {
      patch.completed = true;
      if (!existing.finishedAt) patch.finishedAt = now;
    }
    await db.update(sessions).set(patch).where(eq(sessions.token, input.token));
  }

  const changed =
    !existing ||
    (input.stage !== undefined && input.stage !== existing.stage) ||
    (input.questionIndex !== undefined && input.questionIndex !== existing.questionIndex);

  if (changed && (input.stage || input.questionIndex !== undefined)) {
    await db.insert(events).values({
      sessionToken: input.token,
      kind: input.questionIndex !== undefined && input.questionIndex >= 0 ? 'question' : 'stage',
      stage: input.stage ?? null,
      questionIndex: input.questionIndex ?? null,
      questionId: input.questionId ?? null,
    });
  }

  return { ok: true as const };
}

export const trackRouter = createRouter({
  ping: publicQuery.input(trackInput).mutation(async ({ input, ctx }) => {
    try {
      return await trackPing(input, ctx.req);
    } catch (error) {
      console.warn('Tracking ping failed', error instanceof Error ? error.message : String(error));
      return { ok: false as const };
    }
  }),

  answer: publicQuery
    .input(
      z
        .object({
          token: z.string().min(8).max(64),
          questionId: z.string().min(1).max(64),
          value: z.string().max(MAX_PHOTO_DATA_URL_LENGTH),
        })
        .superRefine((input, context) => {
          if (input.questionId === 'photo') {
            if (input.value && !PHOTO_DATA_URL.test(input.value)) {
              context.addIssue({ code: 'custom', path: ['value'], message: 'Invalid photo data' });
            }
          } else if (input.value.length > 4000) {
            context.addIssue({
              code: 'too_big',
              origin: 'string',
              maximum: 4000,
              inclusive: true,
              path: ['value'],
              message: 'Answer is too long',
            });
          }
        }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [knownSession] = await db
        .select({ token: sessions.token })
        .from(sessions)
        .where(eq(sessions.token, input.token))
        .limit(1);

      if (!knownSession) {
        await db
          .insert(sessions)
          .values({ token: input.token, stage: 'quiz', questionIndex: -1 })
          .onConflictDoNothing({ target: sessions.token });
      }

      await db
        .insert(answers)
        .values({ sessionToken: input.token, questionId: input.questionId, value: input.value })
        .onConflictDoUpdate({
          target: [answers.sessionToken, answers.questionId],
          set: { value: input.value, createdAt: new Date() },
        });

      return { ok: true as const };
    }),
});

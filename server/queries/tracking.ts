import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "./connection";
import { env } from "../lib/env";
import { sessions, events, answers } from "../../db/schema";

// Real, enforced daily capacity — reports are reviewed by a human team,
// so the cap is genuinely small, and this counter is read straight from the DB.
const DAILY_REPORT_CAP = 25;
// Finisher pricing is a real, server-stored 12-hour window per visitor.
const FINISHER_WINDOW_MS = 12 * 3600 * 1000;
const MAX_PHOTO_DATA_URL_LENGTH = 1_200_000;
const PHOTO_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

// ── Admin password gate (server-enforced) ──────────────────
const ADMIN_PASSWORD = env.adminPassword;

function assertAdmin(password: string) {
  if (password !== ADMIN_PASSWORD) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Wrong password" });
  }
}

const trackInput = z.object({
  token: z.string().min(8).max(64),
  stage: z.enum(["landing", "quiz", "analyzing", "report"]).optional(),
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

function ipFromReq(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

async function geoFromIp(ip: string | null): Promise<{ country: string | null; city: string | null }> {
  if (!ip || ip === "127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) {
    return { country: null, city: null };
  }
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`, {
      signal: AbortSignal.timeout(3000),
    });
    const j = (await r.json()) as { status: string; country?: string; city?: string };
    if (j.status === "success") return { country: j.country ?? null, city: j.city ?? null };
  } catch {
    /* geo lookup is best-effort */
  }
  return { country: null, city: null };
}

async function pingInner(input: z.infer<typeof trackInput>, ctx: { req: Request }) {
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(sessions).where(eq(sessions.token, input.token)).limit(1);

    if (!existing) {
      const ip = ipFromReq(ctx.req);
      const { country, city } = await geoFromIp(ip);
      await db.insert(sessions).values({
        token: input.token,
        ip,
        country,
        city,
        userAgent: ctx.req.headers.get("user-agent"),
        stage: input.stage ?? "landing",
        questionIndex: input.questionIndex ?? -1,
        durationMs: input.durationMs ?? 0,
        lastSeenAt: now,
        ...(input.stage === "report" ? { completed: true, finishedAt: now } : {}),
      });
    } else {
      const patch: Partial<typeof sessions.$inferInsert> = {
        lastSeenAt: now,
        durationMs: Math.max(existing.durationMs, input.durationMs ?? 0),
      };
      if (input.stage) patch.stage = input.stage;
      if (input.questionIndex !== undefined) patch.questionIndex = input.questionIndex;
      if (input.stage === "report") {
        patch.completed = true;
        if (!existing.finishedAt) patch.finishedAt = now; // deadline anchor — set once, never moves
      }
      if (input.identity?.name) patch.name = input.identity.name;
      if (input.identity?.email) patch.email = input.identity.email;
      if (input.identity?.phone) patch.phone = input.identity.phone;
      await db.update(sessions).set(patch).where(eq(sessions.token, input.token));

      // location backfill if the first lookup failed
      if (!existing.country) {
        const ip = existing.ip;
        const { country, city } = await geoFromIp(ip);
        if (country) {
          await db.update(sessions).set({ country, city }).where(eq(sessions.token, input.token));
        }
      }
    }

    // log transition events only (stage change or question change)
    const changed =
      !existing ||
      (input.stage && input.stage !== existing.stage) ||
      (input.questionIndex !== undefined && input.questionIndex !== existing.questionIndex);

    if (changed && (input.stage || input.questionIndex !== undefined)) {
      await db.insert(events).values({
        sessionToken: input.token,
        kind: input.questionIndex !== undefined && input.questionIndex >= 0 ? "question" : "stage",
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
      return await pingInner(input, ctx);
    } catch {
      // tracking must never 500 the client — a missed ping is retried by the heartbeat
      return { ok: false as const };
    }
  }),

  answer: publicQuery
    .input(
      z.object({
        token: z.string().min(8).max(64),
        questionId: z.string().min(1).max(64),
        value: z.string().max(MAX_PHOTO_DATA_URL_LENGTH),
      }).superRefine((input, ctx) => {
        if (input.questionId === "photo") {
          if (input.value && !PHOTO_DATA_URL.test(input.value)) {
            ctx.addIssue({ code: "custom", path: ["value"], message: "Invalid photo data" });
          }
          return;
        }
        if (input.value.length > 4000) {
          ctx.addIssue({
            code: "too_big",
            maximum: 4000,
            origin: "string",
            inclusive: true,
            path: ["value"],
            message: "Answer is too long",
          });
        }
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [session] = await db
        .select({ token: sessions.token })
        .from(sessions)
        .where(eq(sessions.token, input.token))
        .limit(1);
      if (!session) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown session" });
      }
      const [prev] = await db
        .select()
        .from(answers)
        .where(eq(answers.sessionToken, input.token))
        .orderBy(desc(answers.id));
      // update-in-place per question: delete old row for same question then insert
      const dupes = await db
        .select()
        .from(answers)
        .where(eq(answers.sessionToken, input.token));
      const dupe = dupes.find((d) => d.questionId === input.questionId);
      if (dupe) {
        await db.update(answers).set({ value: input.value }).where(eq(answers.id, dupe.id));
      } else {
        await db.insert(answers).values({
          sessionToken: input.token,
          questionId: input.questionId,
          value: input.value,
        });
      }
      void prev;
      return { ok: true as const };
    }),
});

// ── Public, real scarcity & deadline ───────────────────────
export const publicRouter = createRouter({
  // Spots left today, counted from actual sessions created since midnight UTC
  spotsLeft: publicQuery.query(async () => {
    const db = getDb();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const [row] = await db
      .select({ n: sql<number>`count(*)` })
      .from(sessions)
      .where(gte(sessions.createdAt, todayStart));
    const used = Number(row?.n ?? 0);
    const resetAt = new Date(todayStart);
    resetAt.setUTCDate(resetAt.getUTCDate() + 1);
    return {
      cap: DAILY_REPORT_CAP,
      used,
      left: Math.max(0, DAILY_REPORT_CAP - used),
      resetAt: resetAt.getTime(),
    };
  }),

  // The visitor's real finisher deadline: finishedAt + 12h, stored server-side
  deadline: publicQuery
    .input(z.object({ token: z.string().min(8).max(64) }))
    .query(async ({ input }) => {
      const db = getDb();
      const [s] = await db.select().from(sessions).where(eq(sessions.token, input.token)).limit(1);
      if (!s?.finishedAt) return { deadline: null as number | null };
      return { deadline: new Date(s.finishedAt).getTime() + FINISHER_WINDOW_MS };
    }),
});

// ── Admin (password-protected) ─────────────────────────────
const adminAuth = z.object({ password: z.string().max(128) });
const adminSessionColumns = {
  id: sessions.id,
  token: sessions.token,
  country: sessions.country,
  city: sessions.city,
  userAgent: sessions.userAgent,
  stage: sessions.stage,
  questionIndex: sessions.questionIndex,
  name: sessions.name,
  email: sessions.email,
  phone: sessions.phone,
  completed: sessions.completed,
  finishedAt: sessions.finishedAt,
  durationMs: sessions.durationMs,
  lastSeenAt: sessions.lastSeenAt,
  createdAt: sessions.createdAt,
};

async function runAdminQuery<T>(name: string, query: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await query();
    console.info(`[admin.${name}] completed`, { durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    console.error(`[admin.${name}] failed`, {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export const adminRouter = createRouter({
  check: publicQuery.input(adminAuth).query(({ input }) => {
    assertAdmin(input.password);
    return { ok: true as const };
  }),

  overview: publicQuery.input(adminAuth).query(async ({ input }) => {
    assertAdmin(input.password);
    return runAdminQuery("overview", async () => {
      const db = getDb();
      const stages = ["landing", "quiz", "analyzing", "report"] as const;
      const countryName = sql<string>`coalesce(${sessions.country}, 'Unknown')`;
      const [summaryRows, stageRows, dropRows, countryRows] = await Promise.all([
        db
          .select({
            total: sql<number>`count(*)`,
            liveNow: sql<number>`count(*) filter (where ${sessions.lastSeenAt} >= now() - interval '90 seconds')`,
            completed: sql<number>`count(*) filter (where ${sessions.completed} = true)`,
            avgDurationMs: sql<number>`coalesce(avg(${sessions.durationMs}), 0)`,
          })
          .from(sessions),
        db
          .select({ stage: sessions.stage, count: sql<number>`count(*)` })
          .from(sessions)
          .groupBy(sessions.stage),
        db
          .select({ questionIndex: sessions.questionIndex, count: sql<number>`count(*)` })
          .from(sessions)
          .where(sql`${sessions.completed} = false and ${sessions.questionIndex} >= 0`)
          .groupBy(sessions.questionIndex),
        db
          .select({ country: countryName, count: sql<number>`count(*)` })
          .from(sessions)
          .groupBy(countryName),
      ]);

      const summary = summaryRows[0];
      const stageCounts = Object.fromEntries(stages.map((stage) => [stage, 0])) as Record<(typeof stages)[number], number>;
      for (const row of stageRows) {
        if (stages.includes(row.stage as (typeof stages)[number])) {
          stageCounts[row.stage as (typeof stages)[number]] = Number(row.count);
        }
      }
      const dropByIndex = Object.fromEntries(
        dropRows.map((row) => [row.questionIndex, Number(row.count)]),
      ) as Record<number, number>;
      const total = Number(summary?.total ?? 0);

      return {
        total,
        liveNow: Number(summary?.liveNow ?? 0),
        completed: Number(summary?.completed ?? 0),
        stageCounts,
        dropByIndex,
        countries: countryRows
          .map((row) => ({ country: row.country, count: Number(row.count) }))
          .sort((a, b) => b.count - a.count),
        avgDurationMs: total ? Math.round(Number(summary?.avgDurationMs ?? 0)) : 0,
      };
    });
  }),

  visitors: publicQuery.input(adminAuth).query(async ({ input }) => {
    assertAdmin(input.password);
    return runAdminQuery("visitors", async () => {
      const db = getDb();
      return db
        .select(adminSessionColumns)
        .from(sessions)
        .orderBy(desc(sessions.lastSeenAt))
        .limit(500);
    });
  }),

  images: publicQuery
    .input(
      z.object({
        password: z.string().max(128),
        cursor: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(24).default(12),
      }),
    )
    .query(async ({ input }) => {
      assertAdmin(input.password);
      return runAdminQuery("images", async () => {
        const db = getDb();
        const storedPhotoFilter = and(
          eq(answers.questionId, "photo"),
          sql`${answers.value} ~ '^data:image/(png|jpe?g|webp);base64,'`,
        );
        const pageFilter = input.cursor
          ? and(storedPhotoFilter, lt(answers.id, input.cursor))
          : storedPhotoFilter;

        const [countRows, rows] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(answers)
            .where(storedPhotoFilter),
          db
            .select({
              id: answers.id,
              token: answers.sessionToken,
              photo: answers.value,
              uploadedAt: answers.createdAt,
              name: sessions.name,
              email: sessions.email,
              city: sessions.city,
              country: sessions.country,
              stage: sessions.stage,
              completed: sessions.completed,
            })
            .from(answers)
            .innerJoin(sessions, eq(sessions.token, answers.sessionToken))
            .where(pageFilter)
            .orderBy(desc(answers.id))
            .limit(input.limit + 1),
        ]);

        const hasMore = rows.length > input.limit;
        const page = rows.slice(0, input.limit).map(row => ({
          ...row,
          photo: row.photo as string,
        }));

        return {
          items: page,
          total: Number(countRows[0]?.count ?? 0),
          nextCursor: hasMore ? page.at(-1)?.id : undefined,
        };
      });
    }),

  sessionDetail: publicQuery
    .input(z.object({ password: z.string().max(128), token: z.string().min(8).max(64) }))
    .query(async ({ input }) => {
      assertAdmin(input.password);
      return runAdminQuery("sessionDetail", async () => {
        const db = getDb();
        const [sessionRows, evts, ans] = await Promise.all([
          db
            .select(adminSessionColumns)
            .from(sessions)
            .where(eq(sessions.token, input.token))
            .limit(1),
          db
            .select()
            .from(events)
            .where(eq(events.sessionToken, input.token))
            .orderBy(asc(events.createdAt))
            .limit(400),
          db
            .select()
            .from(answers)
            .where(eq(answers.sessionToken, input.token))
            .orderBy(asc(answers.createdAt))
            .limit(100),
        ]);
        const [session] = sessionRows;
        return { session, events: evts, answers: ans };
      });
    }),
});

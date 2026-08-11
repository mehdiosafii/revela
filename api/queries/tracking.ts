import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "./connection";
import { sessions, events, answers } from "@db/schema";

// Real, enforced daily capacity — reports are reviewed by a human team,
// so the cap is genuine, and this counter is read straight from the DB.
const DAILY_REPORT_CAP = 300;
// Finisher pricing is a real, server-stored 48-hour window per visitor.
const FINISHER_WINDOW_MS = 48 * 3600 * 1000;

// ── Admin password gate (server-enforced) ──────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "2026";

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

export const trackRouter = createRouter({
  ping: publicQuery.input(trackInput).mutation(async ({ input, ctx }) => {
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
  }),

  answer: publicQuery
    .input(
      z.object({
        token: z.string().min(8).max(64),
        questionId: z.string().min(1).max(64),
        value: z.string().max(4000),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
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
    return { cap: DAILY_REPORT_CAP, used, left: Math.max(0, DAILY_REPORT_CAP - used) };
  }),

  // The visitor's real finisher deadline: finishedAt + 48h, stored server-side
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

export const adminRouter = createRouter({
  check: publicQuery.input(adminAuth).query(({ input }) => {
    assertAdmin(input.password);
    return { ok: true as const };
  }),

  overview: publicQuery.input(adminAuth).query(async ({ input }) => {
    assertAdmin(input.password);
    const db = getDb();
    const all = await db.select().from(sessions).orderBy(desc(sessions.lastSeenAt));

    const now = Date.now();
    const live = all.filter((s) => now - new Date(s.lastSeenAt).getTime() < 90_000);

    const stages = ["landing", "quiz", "analyzing", "report"] as const;
    const stageCounts = Object.fromEntries(stages.map((st) => [st, all.filter((s) => s.stage === st).length]));

    // drop-off per question: count sessions whose final questionIndex == i
    const dropByIndex: Record<number, number> = {};
    for (const s of all) {
      if (s.completed || s.questionIndex < 0) continue;
      dropByIndex[s.questionIndex] = (dropByIndex[s.questionIndex] ?? 0) + 1;
    }

    const countries: Record<string, number> = {};
    for (const s of all) {
      const c = s.country ?? "Unknown";
      countries[c] = (countries[c] ?? 0) + 1;
    }

    return {
      total: all.length,
      liveNow: live.length,
      completed: all.filter((s) => s.completed).length,
      stageCounts,
      dropByIndex,
      countries: Object.entries(countries)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      avgDurationMs: all.length ? Math.round(all.reduce((a, s) => a + s.durationMs, 0) / all.length) : 0,
    };
  }),

  visitors: publicQuery.input(adminAuth).query(async ({ input }) => {
    assertAdmin(input.password);
    const db = getDb();
    return db.select().from(sessions).orderBy(desc(sessions.lastSeenAt)).limit(500);
  }),

  sessionDetail: publicQuery
    .input(z.object({ password: z.string().max(128), token: z.string().min(8).max(64) }))
    .query(async ({ input }) => {
      assertAdmin(input.password);
      const db = getDb();
      const [session] = await db.select().from(sessions).where(eq(sessions.token, input.token)).limit(1);
      const evts = await db
        .select()
        .from(events)
        .where(eq(events.sessionToken, input.token))
        .orderBy(asc(events.createdAt))
        .limit(400);
      const ans = await db
        .select()
        .from(answers)
        .where(eq(answers.sessionToken, input.token))
        .orderBy(asc(answers.createdAt))
        .limit(100);
      return { session, events: evts, answers: ans };
    }),
});

import {
  pgSchema,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// All revela tables live in their own Postgres schema (shared Supabase project)
export const revela = pgSchema("revela");

// One row per visitor session (identified by a cookie-like client token)
export const sessions = revela.table("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  ip: text("ip"),
  country: text("country"),
  city: text("city"),
  userAgent: text("user_agent"),
  stage: text("stage").notNull().default("landing"), // landing | quiz | analyzing | report
  questionIndex: integer("question_index").notNull().default(-1), // current quiz step (-1 = not in quiz)
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  completed: boolean("completed").notNull().default(false),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
  durationMs: integer("duration_ms").notNull().default(0),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// Heartbeats / transitions — powers "where did they stop" + per-section funnel
export const events = revela.table("events", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(),
  kind: text("kind").notNull(), // stage | question
  stage: text("stage"),
  questionIndex: integer("question_index"),
  questionId: text("question_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// Answer snapshot per question (so admin can read what each visitor answered)
export const answers = revela.table("answers", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(),
  questionId: text("question_id").notNull(),
  value: text("value"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

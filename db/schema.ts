import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";

// One row per visitor session (identified by a cookie-like client token)
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  durationMs: integer("duration_ms").notNull().default(0),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull().defaultNow(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

// Heartbeats / transitions — powers "where did they stop" + per-section funnel
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionToken: text("session_token").notNull(),
  kind: text("kind").notNull(), // stage | question
  stage: text("stage"),
  questionIndex: integer("question_index"),
  questionId: text("question_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

// Answer snapshot per question (so admin can read what each visitor answered)
export const answers = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionToken: text("session_token").notNull(),
  questionId: text("question_id").notNull(),
  value: text("value"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

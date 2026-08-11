import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

// One row per visitor session (identified by a cookie-like client token)
export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  ip: varchar("ip", { length: 64 }),
  country: varchar("country", { length: 120 }),
  city: varchar("city", { length: 120 }),
  userAgent: text("user_agent"),
  stage: varchar("stage", { length: 16 }).notNull().default("landing"), // landing | quiz | analyzing | report
  questionIndex: int("question_index").notNull().default(-1), // current quiz step (-1 = not in quiz)
  name: varchar("name", { length: 120 }),
  email: varchar("email", { length: 190 }),
  phone: varchar("phone", { length: 60 }),
  completed: boolean("completed").notNull().default(false),
  finishedAt: timestamp("finished_at"),
  durationMs: int("duration_ms").notNull().default(0),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Heartbeats / transitions — powers "where did they stop" + per-section funnel
export const events = mysqlTable("events", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(), // stage | question
  stage: varchar("stage", { length: 16 }),
  questionIndex: int("question_index"),
  questionId: varchar("question_id", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Answer snapshot per question (so admin can read what each visitor answered)
export const answers = mysqlTable("answers", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 64 }).notNull(),
  questionId: varchar("question_id", { length: 64 }).notNull(),
  value: text("value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

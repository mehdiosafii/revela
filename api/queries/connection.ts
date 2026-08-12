import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    // data/ on Render is the mounted persistent disk; locally it's just ./data
    const file = env.databasePath || "./data/revela.db";
    mkdirSync(dirname(file), { recursive: true });
    const sqlite = new Database(file);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("busy_timeout = 5000");
    instance = drizzle(sqlite, { schema: fullSchema });
    ensureTables(sqlite);
  }
  return instance;
}

// create tables if missing — no migration step needed on deploy
function ensureTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      ip TEXT,
      country TEXT,
      city TEXT,
      user_agent TEXT,
      stage TEXT NOT NULL DEFAULT 'landing',
      question_index INTEGER NOT NULL DEFAULT -1,
      name TEXT,
      email TEXT,
      phone TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      finished_at INTEGER,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      last_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT NOT NULL,
      kind TEXT NOT NULL,
      stage TEXT,
      question_index INTEGER,
      question_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT NOT NULL,
      question_id TEXT NOT NULL,
      value TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_token);
    CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
  `);
}

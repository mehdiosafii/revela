import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../lib/env";
import * as schema from "../../db/schema";
import * as relations from "../../db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>> | undefined;

export function getDb() {
  if (!instance) {
    // Supabase transaction pooler (port 6543) — prepared statements must be
    // disabled (pgbouncer), and one connection per serverless instance is enough.
    const client = postgres(env.databaseUrl, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}

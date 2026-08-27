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
    // disabled (pgbouncer). Vercel Fluid Compute serves concurrent requests in
    // one function instance, so a small pool prevents unrelated requests from
    // queueing behind a single slow or stale connection.
    const client = postgres(env.databaseUrl, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      keep_alive: 20,
      max_lifetime: 300,
      connection: {
        application_name: "revela-vercel",
      },
    });
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}

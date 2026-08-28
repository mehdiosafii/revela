import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as relations from '../../db/relations';
import * as schema from '../../db/schema';
import { env } from '../lib/env';

const fullSchema = { ...schema, ...relations };
let instance: ReturnType<typeof drizzle<typeof fullSchema>> | undefined;

export function getDb() {
  if (!instance) {
    const client = postgres(env.databaseUrl, {
      prepare: false,
      max: process.env.VERCEL ? 2 : 5,
      idle_timeout: 15,
      connect_timeout: 8,
      keep_alive: 20,
      max_lifetime: 300,
      connection: { application_name: 'revela-vercel' },
    });
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}

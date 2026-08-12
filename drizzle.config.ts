import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  schemaFilter: ["revela"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

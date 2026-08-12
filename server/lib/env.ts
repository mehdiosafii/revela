import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: process.env.APP_ID ?? "revela",
  appSecret: process.env.APP_SECRET ?? "revela-secret",
  isProduction: process.env.NODE_ENV === "production",
  // Supabase Postgres connection string (transaction pooler, port 6543)
  databaseUrl: required("DATABASE_URL"),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  port: Number(process.env.PORT ?? 3000),
};

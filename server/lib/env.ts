import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? '';
}

export const env = {
  appId: process.env.APP_ID ?? 'revela',
  appSecret: process.env.APP_SECRET ?? 'revela-development-secret',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: required('DATABASE_URL'),
  adminPassword: required('ADMIN_PASSWORD'),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? '',
  publicAppUrl: process.env.PUBLIC_APP_URL?.trim() ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
  port: Number(process.env.PORT ?? 3000),
};

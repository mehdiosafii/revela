const configured = {
  database: Boolean(process.env.DATABASE_URL),
  adminPassword: Boolean(process.env.ADMIN_PASSWORD),
  publicAppUrl: Boolean(process.env.PUBLIC_APP_URL),
  stripeCheckout: Boolean(process.env.STRIPE_SECRET_KEY),
  stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  textGeneration: Boolean(process.env.MOONSHOT_API_KEY || process.env.ANTHROPIC_API_KEY),
  illustrations: Boolean(process.env.GEMINI_API_KEY),
};
console.log(`REVELA_CONFIG_CHECK ${JSON.stringify(configured)}`);

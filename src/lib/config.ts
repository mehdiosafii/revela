// ─────────────────────────────────────────────────────────────
// Revela — commercial configuration (edit these, everything wires itself)
// ─────────────────────────────────────────────────────────────

// 1. Create a Stripe Payment Link for the Revela Blueprint ($97):
//    Stripe Dashboard → Payment Links → New → paste the URL below.
//    The "Unlock My Full Blueprint" buttons point here.
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_replace_with_your_payment_link';

// 2. Support contact — shown in footer, Terms, Privacy and Refund policy.
//    Stripe & ad platforms require a working contact channel.
export const SUPPORT_EMAIL = 'support@revela.institute';

// 3. Legal entity name shown in the policies.
export const LEGAL_ENTITY = 'Revela Institute';

// 4. Claude API key — powers the deep AI report.
//    Get yours at console.anthropic.com → paste it here.
//    Leave blank to use the built-in (already strong) report generator.
export const CLAUDE_API_KEY = '';

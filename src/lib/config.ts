// ─────────────────────────────────────────────────────────────
// Revela — commercial configuration (edit these, everything wires itself)
// ─────────────────────────────────────────────────────────────

// 1. Create a Stripe Payment Link for the full report unlock ($9.99):
//    Stripe Dashboard → Payment Links → New → paste the URL below.
//    The "Unlock My Full Report" buttons point here.
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_replace_with_your_payment_link';

// The unlock price shown across the report page.
export const UNLOCK_PRICE = '$9.99';
export const UNLOCK_PRICE_ANCHOR = '$49.99';

// 2. Support contact — shown in footer, Terms, Privacy and Refund policy.
//    Stripe & ad platforms require a working contact channel.
export const SUPPORT_EMAIL = 'support@revela.institute';

// 3. Legal entity name shown in the policies.
export const LEGAL_ENTITY = 'Revela Institute';

// 4. AI report keys live in the server .env (MOONSHOT_API_KEY / ANTHROPIC_API_KEY)
//    — never in client code.

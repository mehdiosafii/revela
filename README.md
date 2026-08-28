# Revela

Revela is a React/Vite relationship-pattern assessment with a useful free Pattern Snapshot and an optional paid **Secure Love Reset**. The product is educational self-reflection and relationship decision-support content; it is not therapy, diagnosis, or a promise of a relationship outcome.

## Funnel and product

1. A visitor completes 14 focused questions without an email, upload, or payment wall.
2. Revela immediately shows a genuine free Pattern Snapshot: recurring loop, strongest trigger, blind spot, and one practical action.
3. The visitor may purchase the Secure Love Reset for a one-time $29 payment.
4. Stripe Checkout is created on the server and paid access is granted only after Stripe status, amount, currency, mode, and private session ownership are verified.
5. Paid customers receive a five-tab workspace: 30-day actions, Trigger & Text SOS, Date Decision history, Script Vault, and Personal Map, plus the long printable reading.
6. Expensive AI narrative and optional image generation run only for verified paid sessions, and successful premium narratives are cached in the database.

## Stack

- React 19, TypeScript, Vite, Tailwind
- tRPC and Hono on Vercel Functions
- Drizzle ORM with Supabase Postgres transaction pooling
- Stripe-hosted Checkout with landing-page verification and signed webhook fulfillment
- Moonshot with optional Anthropic fallback for paid deep readings
- Optional Gemini image generation for paid reflection illustrations

## Local setup

```bash
cp .env.example .env
npm ci
npm run dev
```

Required in production:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `PUBLIC_APP_URL=https://revela.love`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

At least one text-generation provider is recommended:

- `MOONSHOT_API_KEY`
- `ANTHROPIC_API_KEY`

`GEMINI_API_KEY` is optional and enables paid reflection illustrations.

## Database migration

Apply `db/migrations/0001_secure_checkout.sql` to the Supabase database before deploying checkout. It creates the private `revela.purchases` entitlement/cache table, enforces one answer per question/session, and revokes Data API access from public Supabase roles.

The application uses the `revela` schema through a server-only Postgres connection. Do not expose that schema through the Supabase Data API.

## Stripe configuration

Create a Stripe webhook endpoint pointing to:

```text
https://revela.love/api/stripe-webhook
```

Subscribe it to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Store the endpoint signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel Production and Preview environments. The success-page verification remains in place for immediate access while the customer is present; the webhook provides durable fulfillment when the redirect is interrupted.

## Validation

```bash
npm run check
npm run test -- --passWithNoTests
npm run build
```

The GitHub Actions workflow in `.github/workflows/validate.yml` runs the same checks for pull requests and pushes.

## Payment security

The browser never unlocks the paid product from a URL flag. The flow is:

1. `checkout.create` creates a Stripe Checkout Session with the private Revela session token in `client_reference_id` and metadata.
2. Stripe redirects back with `{CHECKOUT_SESSION_ID}`.
3. `checkout.verify` retrieves that Session directly from Stripe and checks that it is complete, paid, the exact $29 USD offer, and belongs to the same Revela session.
4. The signed Stripe webhook independently fulfills eligible paid sessions.
5. A paid entitlement and cached report are stored in `revela.purchases`.
6. `checkout.entitlement` restores access on subsequent visits from the same private browser session.

## Privacy notes

- Assessment answers are stored to create and restore the experience.
- Stripe handles card data; Revela stores only limited transaction metadata.
- Optional source photos are processed for image generation and are not written to the Revela database or permanent server storage.
- Generated illustrations may be cached locally in the customer’s browser.
- Meta Pixel loads only after marketing-measurement consent, and the product never sends assessment-answer text in Pixel events.

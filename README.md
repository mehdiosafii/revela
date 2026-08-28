# Revela

Revela is a React/Vite relationship-pattern assessment with a free Pattern Snapshot and an optional paid **Secure Love Reset**. The product is educational self-reflection and decision-support content; it is not therapy, diagnosis, or a promise of a relationship outcome.

## Funnel

1. A visitor completes 14 focused questions without an email or payment wall.
2. Revela immediately shows a useful free Pattern Snapshot.
3. The visitor may purchase the Secure Love Reset for a one-time $29 payment.
4. Stripe Checkout is created on the server and access is granted only after the returned Checkout Session is retrieved and verified server-side.
5. Expensive AI narrative and optional image generation run only for verified paid sessions.

## Stack

- React 19, TypeScript, Vite, Tailwind
- tRPC and Hono on Vercel Functions
- Drizzle ORM with Supabase Postgres transaction pooling
- Stripe Checkout Sessions through the REST API
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

At least one text-generation provider is recommended:

- `MOONSHOT_API_KEY`
- `ANTHROPIC_API_KEY`

`GEMINI_API_KEY` is optional and enables paid reflection illustrations.

## Database migration

Apply `db/migrations/0001_secure_checkout.sql` to the Supabase database before deploying the checkout code. It creates the private `revela.purchases` entitlement table and enforces one stored answer per question/session.

The application uses the `revela` schema through a server-only Postgres connection. Do not expose that schema through the Supabase Data API.

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
4. A paid entitlement is stored in `revela.purchases`.
5. `checkout.entitlement` restores access and the cached premium report on subsequent visits from the same private session.

## Privacy notes

- Assessment answers are stored to create and restore the experience.
- Stripe handles card data; Revela stores only limited transaction metadata.
- Optional source photos are processed in-memory for image generation and are not written to the database or permanent server storage.
- Generated illustrations may be cached locally in the customer’s browser.
- Meta Pixel loads only after marketing-measurement consent and must never include assessment-answer text.

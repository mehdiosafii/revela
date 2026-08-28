import { eq } from 'drizzle-orm';
import { purchases, sessions } from '../db/schema';
import { getDb } from './queries/connection';
import { verifyStripeSignature } from './stripe-signature';

export const config = {
  api: {
    bodyParser: false,
  },
};

const OFFER_AMOUNT_CENTS = 2900;
const OFFER_CURRENCY = 'usd';
const TOKEN_PATTERN = /^rv_[a-z0-9]{8,60}$/i;

interface CheckoutSessionPayload {
  id?: string;
  mode?: string | null;
  status?: string | null;
  payment_status?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null } | null;
}

interface StripeEvent {
  id?: string;
  type?: string;
  data?: { object?: CheckoutSessionPayload };
}

function paymentIntentId(session: CheckoutSessionPayload): string | null {
  if (typeof session.payment_intent === 'string') return session.payment_intent;
  return session.payment_intent?.id ?? null;
}

async function readRawBody(request: any): Promise<string> {
  if (typeof request.body === 'string') return request.body;
  if (Buffer.isBuffer(request.body)) return request.body.toString('utf8');

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function send(response: any, status: number, payload: Record<string, unknown>) {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
  response.end(JSON.stringify(payload));
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST');
    send(response, 405, { error: 'Method Not Allowed' });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured');
    send(response, 503, { error: 'Webhook not configured' });
    return;
  }

  const rawBody = await readRawBody(request);
  const signatureHeader = String(request.headers?.['stripe-signature'] ?? '');
  if (!verifyStripeSignature(rawBody, signatureHeader, webhookSecret)) {
    send(response, 400, { error: 'Invalid signature' });
    return;
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    send(response, 400, { error: 'Invalid JSON' });
    return;
  }

  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type ?? '')) {
    send(response, 200, { received: true, ignored: true });
    return;
  }

  const checkout = event.data?.object;
  const token = checkout?.client_reference_id || checkout?.metadata?.session_token || '';
  const eligible =
    Boolean(checkout?.id) &&
    TOKEN_PATTERN.test(token) &&
    checkout?.mode === 'payment' &&
    checkout?.payment_status === 'paid' &&
    checkout?.amount_total === OFFER_AMOUNT_CENTS &&
    checkout?.currency?.toLowerCase() === OFFER_CURRENCY;

  if (!eligible || !checkout?.id) {
    console.warn('Stripe webhook ignored an ineligible checkout event', {
      eventId: event.id,
      eventType: event.type,
      checkoutId: checkout?.id,
    });
    send(response, 200, { received: true, ignored: true });
    return;
  }

  const db = getDb();
  const now = new Date();
  await db
    .insert(sessions)
    .values({
      token,
      stage: 'report',
      questionIndex: -1,
      email: checkout.customer_details?.email ?? null,
      completed: true,
      finishedAt: now,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: sessions.token,
      set: {
        email: checkout.customer_details?.email ?? undefined,
        stage: 'report',
        completed: true,
        lastSeenAt: now,
      },
    });

  await db
    .insert(purchases)
    .values({
      sessionToken: token,
      stripeCheckoutSessionId: checkout.id,
      stripePaymentIntentId: paymentIntentId(checkout),
      customerEmail: checkout.customer_details?.email ?? null,
      amountTotal: checkout.amount_total ?? OFFER_AMOUNT_CENTS,
      currency: checkout.currency ?? OFFER_CURRENCY,
      status: 'paid',
      paidAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: purchases.sessionToken,
      set: {
        stripeCheckoutSessionId: checkout.id,
        stripePaymentIntentId: paymentIntentId(checkout),
        customerEmail: checkout.customer_details?.email ?? null,
        amountTotal: checkout.amount_total ?? OFFER_AMOUNT_CENTS,
        currency: checkout.currency ?? OFFER_CURRENCY,
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      },
    });

  await db
    .update(sessions)
    .set({
      email: checkout.customer_details?.email ?? undefined,
      completed: true,
      stage: 'report',
      lastSeenAt: now,
    })
    .where(eq(sessions.token, token));

  send(response, 200, { received: true });
}

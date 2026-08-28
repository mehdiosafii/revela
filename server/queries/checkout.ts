import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { answers, purchases, sessions } from '../../db/schema';
import { createRouter, publicQuery } from '../middleware';
import { getDb } from './connection';

const OFFER_AMOUNT_CENTS = 2900;
const OFFER_CURRENCY = 'usd';
const OFFER_NAME = 'Revela Secure Love Reset';

interface StripeCheckoutSession {
  id: string;
  status: 'open' | 'complete' | 'expired' | null;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  mode?: 'payment' | 'setup' | 'subscription' | null;
  client_reference_id: string | null;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null } | null;
  url?: string | null;
  created?: number;
}

function stripeSecret(): string {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Secure checkout is not configured.',
    });
  }
  return value;
}

function publicOrigin(req: Request): string {
  const requestOrigin = new URL(req.url).origin;
  // Keep preview checkouts on the preview deployment. Production uses the
  // canonical configured origin so Stripe never redirects to an untrusted host.
  if (process.env.VERCEL_ENV === 'preview' && requestOrigin.startsWith('https://')) {
    return requestOrigin;
  }

  const configured = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (requestOrigin.startsWith('https://') || requestOrigin.startsWith('http://localhost')) return requestOrigin;
  return 'https://revela.love';
}

async function stripeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${stripeSecret()}`,
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  });

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as { error?: { message?: string } }).error?.message ?? 'Stripe request failed')
        : 'Stripe request failed';
    console.error('Stripe API error', response.status, message);
    throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Secure checkout is temporarily unavailable.' });
  }

  return parsed as T;
}

function paymentIntentId(session: StripeCheckoutSession): string | null {
  if (typeof session.payment_intent === 'string') return session.payment_intent;
  return session.payment_intent?.id ?? null;
}

async function ensureSession(token: string) {
  const db = getDb();
  await db
    .insert(sessions)
    .values({ token, stage: 'report', questionIndex: -1 })
    .onConflictDoNothing({ target: sessions.token });
}

async function answerMapFor(token: string): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db
    .select({ questionId: answers.questionId, value: answers.value })
    .from(answers)
    .where(eq(answers.sessionToken, token))
    .orderBy(desc(answers.id));

  const result: Record<string, string> = {};
  for (const row of rows) {
    if (row.questionId === 'photo' || result[row.questionId] !== undefined || !row.value) continue;
    result[row.questionId] = row.value;
  }
  return result;
}

export const checkoutRouter = createRouter({
  create: publicQuery
    .input(z.object({ token: z.string().min(8).max(64) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await ensureSession(input.token);

      const [existing] = await db
        .select({ status: purchases.status })
        .from(purchases)
        .where(eq(purchases.sessionToken, input.token))
        .limit(1);
      const origin = publicOrigin(ctx.req);
      if (existing?.status === 'paid') {
        return { url: `${origin}/?checkout=restored`, alreadyPaid: true as const };
      }

      const form = new URLSearchParams();
      form.set('mode', 'payment');
      form.set('success_url', `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
      form.set('cancel_url', `${origin}/?checkout=cancelled`);
      form.set('client_reference_id', input.token);
      form.set('metadata[session_token]', input.token);
      form.set('payment_intent_data[metadata][session_token]', input.token);
      form.set('line_items[0][price_data][currency]', OFFER_CURRENCY);
      form.set('line_items[0][price_data][unit_amount]', String(OFFER_AMOUNT_CENTS));
      form.set('line_items[0][price_data][product_data][name]', OFFER_NAME);
      form.set(
        'line_items[0][price_data][product_data][description]',
        'Personal pattern map, date filter, script vault, trigger guide, 90-day practice path, and downloadable deep reading.',
      );
      form.set('line_items[0][quantity]', '1');
      form.set('submit_type', 'pay');
      form.set('locale', 'auto');

      const checkout = await stripeRequest<StripeCheckoutSession>('/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': `revela-checkout-${input.token}-v2`,
        },
        body: form.toString(),
      });

      if (!checkout.url) {
        throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Stripe did not return a checkout URL.' });
      }
      return { url: checkout.url, alreadyPaid: false as const };
    }),

  verify: publicQuery
    .input(
      z.object({
        token: z.string().min(8).max(64),
        sessionId: z.string().min(10).max(255).refine((value) => value.startsWith('cs_'), 'Invalid checkout session'),
      }),
    )
    .mutation(async ({ input }) => {
      const checkout = await stripeRequest<StripeCheckoutSession>(
        `/v1/checkout/sessions/${encodeURIComponent(input.sessionId)}`,
      );

      const belongsToSession =
        checkout.client_reference_id === input.token || checkout.metadata?.session_token === input.token;
      const paid =
        checkout.status === 'complete' &&
        checkout.payment_status === 'paid' &&
        checkout.mode === 'payment' &&
        checkout.amount_total === OFFER_AMOUNT_CENTS &&
        checkout.currency?.toLowerCase() === OFFER_CURRENCY &&
        belongsToSession;
      if (!paid) return { paid: false as const };

      const db = getDb();
      await ensureSession(input.token);
      await db
        .insert(purchases)
        .values({
          sessionToken: input.token,
          stripeCheckoutSessionId: checkout.id,
          stripePaymentIntentId: paymentIntentId(checkout),
          customerEmail: checkout.customer_details?.email ?? null,
          amountTotal: checkout.amount_total ?? OFFER_AMOUNT_CENTS,
          currency: checkout.currency ?? OFFER_CURRENCY,
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
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
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });

      await db
        .update(sessions)
        .set({ completed: true, stage: 'report', lastSeenAt: new Date() })
        .where(eq(sessions.token, input.token));

      return { paid: true as const };
    }),

  entitlement: publicQuery
    .input(z.object({ token: z.string().min(8).max(64) }))
    .query(async ({ input }) => {
      const db = getDb();
      const [purchase] = await db
        .select({ status: purchases.status, paidAt: purchases.paidAt, reportJson: purchases.reportJson })
        .from(purchases)
        .where(eq(purchases.sessionToken, input.token))
        .limit(1);

      if (purchase?.status !== 'paid') return { paid: false as const, answers: null, report: null };
      let report: unknown = null;
      if (purchase.reportJson) {
        try {
          report = JSON.parse(purchase.reportJson);
        } catch {
          report = null;
        }
      }
      return {
        paid: true as const,
        paidAt: purchase.paidAt,
        answers: await answerMapFor(input.token),
        report,
      };
    }),
});

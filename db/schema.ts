import {
  boolean,
  integer,
  pgSchema,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Revela lives in a private Postgres schema inside the shared Supabase project.
export const revela = pgSchema('revela');

export const sessions = revela.table('sessions', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  ip: text('ip'),
  country: text('country'),
  city: text('city'),
  userAgent: text('user_agent'),
  stage: text('stage').notNull().default('landing'),
  questionIndex: integer('question_index').notNull().default(-1),
  name: text('name'),
  email: text('email'),
  phone: text('phone'),
  completed: boolean('completed').notNull().default(false),
  finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
  durationMs: integer('duration_ms').notNull().default(0),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const events = revela.table('events', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').notNull(),
  kind: text('kind').notNull(),
  stage: text('stage'),
  questionIndex: integer('question_index'),
  questionId: text('question_id'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const answers = revela.table(
  'answers',
  {
    id: serial('id').primaryKey(),
    sessionToken: text('session_token').notNull(),
    questionId: text('question_id').notNull(),
    value: text('value'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('answers_session_question_unique').on(table.sessionToken, table.questionId)],
);

// Server-verified Stripe entitlement. The browser never grants access by itself.
export const purchases = revela.table(
  'purchases',
  {
    id: serial('id').primaryKey(),
    sessionToken: text('session_token').notNull(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    customerEmail: text('customer_email'),
    amountTotal: integer('amount_total'),
    currency: text('currency'),
    status: text('status').notNull().default('pending'),
    reportJson: text('report_json'),
    reportProvider: text('report_provider'),
    reportGeneratedAt: timestamp('report_generated_at', { withTimezone: true, mode: 'date' }),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('purchases_session_token_unique').on(table.sessionToken),
    uniqueIndex('purchases_checkout_session_unique').on(table.stripeCheckoutSessionId),
  ],
);

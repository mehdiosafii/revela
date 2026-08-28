-- Secure Stripe entitlement and efficient answer upserts.

create table if not exists revela.purchases (
  id serial primary key,
  session_token text not null,
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  customer_email text,
  amount_total integer,
  currency text,
  status text not null default 'pending',
  report_json text,
  report_provider text,
  report_generated_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table revela.purchases add column if not exists report_json text;
alter table revela.purchases add column if not exists report_provider text;
alter table revela.purchases add column if not exists report_generated_at timestamptz;

create unique index if not exists purchases_session_token_unique
  on revela.purchases (session_token);

create unique index if not exists purchases_checkout_session_unique
  on revela.purchases (stripe_checkout_session_id);

-- Retain the most recent answer before enforcing one answer per question/session.
delete from revela.answers older
using revela.answers newer
where older.session_token = newer.session_token
  and older.question_id = newer.question_id
  and older.id < newer.id;

create unique index if not exists answers_session_question_unique
  on revela.answers (session_token, question_id);

-- The Revela schema is used only by the server connection, not Supabase's public Data API.
revoke all on table revela.sessions, revela.events, revela.answers, revela.purchases from anon, authenticated;

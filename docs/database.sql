-- Suggested PostgreSQL / Supabase schema matching types/order.ts.
-- Implement an OrderRepository (lib/orders/repository.ts) against these tables
-- and set ORDER_STORE=postgres. Not wired up yet.

create table orders (
  id               uuid primary key,
  number           text not null unique,
  idempotency_key  uuid not null unique,
  fingerprint      text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  fulfillment_type text not null check (fulfillment_type in ('pickup','delivery')),
  requested_time   text not null,          -- 'asap' or ISO instant
  estimated_ready_at timestamptz not null,
  delivery_address jsonb,
  zone_id          text,
  notes            text,
  lines            jsonb not null,         -- PricedLine[] snapshot (names + prices at time of order)
  subtotal_cents   integer not null,
  service_fee_cents integer not null,
  delivery_fee_cents integer not null,
  discount_cents   integer not null,
  tax_cents        integer not null,
  total_cents      integer not null,
  currency         char(3) not null,
  payment_method   text not null,
  payment_status   text not null,
  payment_provider text not null,
  payment_reference text unique,
  status           text not null,
  status_history   jsonb not null,
  demo             boolean not null default false
);

create index orders_created_at_idx on orders (created_at desc);
create index orders_status_idx on orders (status);

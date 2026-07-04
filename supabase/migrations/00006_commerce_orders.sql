-- S2B: commerce.orders with frozen shopping_cart JSONB

create table if not exists commerce.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment',
      'paid',
      'preparing',
      'ready',
      'delivered',
      'completed',
      'cancelled'
    )),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'confirmed', 'refunded')),
  customer_id uuid,
  contact jsonb not null default '{}',
  fulfillment jsonb not null default '{}',
  shopping_cart jsonb not null,
  payment_methods jsonb not null default '[]',
  subtotal numeric(12, 2) not null,
  discount_total numeric(12, 2) not null default 0,
  shipping_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  pricing_snapshot jsonb not null default '{}',
  currency_code text not null default 'PEN'
    check (currency_code = 'PEN'),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_shopping_cart_has_lines
    check (jsonb_typeof(shopping_cart -> 'lines') = 'array'
      and jsonb_array_length(shopping_cart -> 'lines') >= 1),
  constraint orders_totals_non_negative
    check (
      subtotal >= 0
      and discount_total >= 0
      and shipping_total >= 0
      and total >= 0
    )
);

create index if not exists orders_status_idx
  on commerce.orders (status);

create index if not exists orders_created_at_idx
  on commerce.orders (created_at desc);

create index if not exists orders_order_number_idx
  on commerce.orders (order_number);

alter table commerce.orders enable row level security;

create policy "orders_select_staff"
  on commerce.orders for select
  using (core.is_staff());

create policy "orders_insert_staff"
  on commerce.orders for insert
  with check (core.is_staff());

create policy "orders_update_staff"
  on commerce.orders for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger orders_set_updated_at
  before update on commerce.orders
  for each row execute function core.set_updated_at();

grant usage on schema commerce to anon, authenticated;
grant select, insert, update on commerce.orders to authenticated;

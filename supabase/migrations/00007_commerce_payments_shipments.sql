-- S2C: commerce.payments + commerce.shipments

create table if not exists commerce.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references commerce.orders (id) on delete restrict,
  amount numeric(12, 2) not null,
  currency_code text not null default 'PEN'
    check (currency_code = 'PEN'),
  status text not null
    check (status in ('pending', 'confirmed', 'refunded')),
  method text not null default 'internal'
    check (method = 'internal'),
  confirmed_by uuid,
  notes text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_non_negative check (amount >= 0)
);

create index if not exists payments_order_id_idx
  on commerce.payments (order_id);

create table if not exists commerce.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references commerce.orders (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'shipped', 'delivered')),
  tracking_number text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shipments_order_id_idx
  on commerce.shipments (order_id);

alter table commerce.payments enable row level security;
alter table commerce.shipments enable row level security;

create policy "payments_select_staff"
  on commerce.payments for select
  using (core.is_staff());

create policy "payments_insert_staff"
  on commerce.payments for insert
  with check (core.is_staff());

create policy "payments_update_staff"
  on commerce.payments for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "shipments_select_staff"
  on commerce.shipments for select
  using (core.is_staff());

create policy "shipments_insert_staff"
  on commerce.shipments for insert
  with check (core.is_staff());

create policy "shipments_update_staff"
  on commerce.shipments for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger payments_set_updated_at
  before update on commerce.payments
  for each row execute function core.set_updated_at();

create trigger shipments_set_updated_at
  before update on commerce.shipments
  for each row execute function core.set_updated_at();

grant select, insert, update on commerce.payments to authenticated;
grant select, insert, update on commerce.shipments to authenticated;

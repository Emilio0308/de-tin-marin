-- S1C foundation: pricing.campaigns + products.campaign_id (sin uso operativo v1)

create table if not exists pricing.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  percentage numeric(5, 2) not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_percentage_range check (percentage >= 0 and percentage <= 100),
  constraint campaigns_dates_valid check (ends_at > starts_at)
);

alter table catalog.products
  add column if not exists campaign_id uuid references pricing.campaigns (id);

create index if not exists products_campaign_id_idx
  on catalog.products (campaign_id)
  where campaign_id is not null;

alter table pricing.campaigns enable row level security;

create policy "campaigns_select_staff"
  on pricing.campaigns for select
  using (core.is_staff());

create policy "campaigns_insert_staff"
  on pricing.campaigns for insert
  with check (core.is_staff());

create policy "campaigns_update_staff"
  on pricing.campaigns for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "campaigns_delete_staff"
  on pricing.campaigns for delete
  using (core.is_staff());

create trigger campaigns_set_updated_at
  before update on pricing.campaigns
  for each row execute function core.set_updated_at();

-- API grants (DECISIONS #21)
grant usage on schema pricing to anon, authenticated;
grant select on pricing.campaigns to anon, authenticated;
grant insert, update, delete on pricing.campaigns to authenticated;

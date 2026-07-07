-- S1E: surprise containers (insumos), delivery zones, bundles.container_id

-- catalog.surprise_containers
create table if not exists catalog.surprise_containers (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  description text,
  image_url text,
  prices jsonb not null default '{}'::jsonb,
  stock_quantity int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint surprise_containers_stock_non_negative check (stock_quantity >= 0)
);

create unique index if not exists surprise_containers_sku_active_idx
  on catalog.surprise_containers (sku)
  where deleted_at is null;

create index if not exists surprise_containers_active_idx
  on catalog.surprise_containers (created_at desc)
  where deleted_at is null and is_active = true;

alter table catalog.surprise_containers enable row level security;

create policy "surprise_containers_select_public"
  on catalog.surprise_containers for select
  using (is_active = true and deleted_at is null);

create policy "surprise_containers_select_staff"
  on catalog.surprise_containers for select
  using (core.is_staff());

create policy "surprise_containers_insert_staff"
  on catalog.surprise_containers for insert
  with check (core.is_staff());

create policy "surprise_containers_update_staff"
  on catalog.surprise_containers for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "surprise_containers_delete_staff"
  on catalog.surprise_containers for delete
  using (core.is_staff());

create trigger surprise_containers_set_updated_at
  before update on catalog.surprise_containers
  for each row execute function core.set_updated_at();

-- Backfill containers from existing bundles before dropping service_fee
alter table catalog.bundles
  add column if not exists container_id uuid references catalog.surprise_containers (id);

do $$
declare
  bundle_row record;
  unit_price numeric(12, 2);
  resolved_container_id uuid;
  price_json jsonb;
  subtotal numeric(12, 2);
  igv_amount numeric(12, 2);
begin
  for bundle_row in
    select id, service_fee, quantity
    from catalog.bundles
    where container_id is null
  loop
    unit_price := round(bundle_row.service_fee / bundle_row.quantity, 2);
    subtotal := round(unit_price / 1.18, 2);
    igv_amount := round(unit_price - subtotal, 2);
    price_json := jsonb_build_object(
      'netPrice', unit_price,
      'subtotal', subtotal,
      'igv', igv_amount
    );

    select sc.id into resolved_container_id
    from catalog.surprise_containers sc
    where sc.deleted_at is null
      and (sc.prices->>'netPrice')::numeric = unit_price
    limit 1;

    if resolved_container_id is null then
      insert into catalog.surprise_containers (sku, name, prices, stock_quantity, is_active)
      values (
        'ENV-' || replace(unit_price::text, '.', '-'),
        case
          when unit_price = 0 then 'Envase sin costo'
          else 'Envase S/' || unit_price::text
        end,
        price_json,
        0,
        true
      )
      returning id into resolved_container_id;
    end if;

    update catalog.bundles
    set container_id = resolved_container_id
    where id = bundle_row.id;
  end loop;
end $$;

-- Default container for bundles without rows (empty DB edge case)
insert into catalog.surprise_containers (sku, name, prices, stock_quantity, is_active)
select
  'ENV-0',
  'Envase sin costo',
  jsonb_build_object('netPrice', 0, 'subtotal', 0, 'igv', 0),
  0,
  true
where not exists (select 1 from catalog.surprise_containers where deleted_at is null);

update catalog.bundles
set container_id = (
  select id from catalog.surprise_containers where sku = 'ENV-0' limit 1
)
where container_id is null;

alter table catalog.bundles
  alter column container_id set not null;

alter table catalog.bundles
  drop constraint if exists bundles_service_fee_non_negative;

alter table catalog.bundles
  drop column if exists service_fee;

create index if not exists bundles_container_id_idx on catalog.bundles (container_id);

-- pricing.delivery_settings (singleton)
create table if not exists pricing.delivery_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  fallback_fee numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  constraint delivery_settings_singleton_key unique (singleton_key),
  constraint delivery_settings_fallback_fee_non_negative check (fallback_fee >= 0)
);

insert into pricing.delivery_settings (singleton_key, pickup_enabled, delivery_enabled, fallback_fee)
values ('default', true, true, 20.00)
on conflict (singleton_key) do nothing;

alter table pricing.delivery_settings enable row level security;

create policy "delivery_settings_select_public"
  on pricing.delivery_settings for select
  using (true);

create policy "delivery_settings_update_staff"
  on pricing.delivery_settings for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger delivery_settings_set_updated_at
  before update on pricing.delivery_settings
  for each row execute function core.set_updated_at();

-- pricing.delivery_zones
create table if not exists pricing.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  district text not null,
  fee numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_zones_district_unique unique (district),
  constraint delivery_zones_fee_non_negative check (fee >= 0)
);

create index if not exists delivery_zones_active_sort_idx
  on pricing.delivery_zones (sort_order, district)
  where is_active = true;

alter table pricing.delivery_zones enable row level security;

create policy "delivery_zones_select_public"
  on pricing.delivery_zones for select
  using (is_active = true);

create policy "delivery_zones_select_staff"
  on pricing.delivery_zones for select
  using (core.is_staff());

create policy "delivery_zones_insert_staff"
  on pricing.delivery_zones for insert
  with check (core.is_staff());

create policy "delivery_zones_update_staff"
  on pricing.delivery_zones for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "delivery_zones_delete_staff"
  on pricing.delivery_zones for delete
  using (core.is_staff());

create trigger delivery_zones_set_updated_at
  before update on pricing.delivery_zones
  for each row execute function core.set_updated_at();

-- Seed distritos — Piura (ciudad)
insert into pricing.delivery_zones (district, fee, sort_order) values
  ('Piura', 8.00, 1),
  ('Castilla', 8.00, 2),
  ('26 de Octubre', 10.00, 3),
  ('La Unión', 12.00, 4),
  ('Catacaos', 15.00, 5)
on conflict (district) do nothing;

-- API grants (DECISIONS #21)
grant select on catalog.surprise_containers to anon, authenticated;
grant insert, update, delete on catalog.surprise_containers to authenticated;

grant select on pricing.delivery_zones to anon, authenticated;
grant insert, update, delete on pricing.delivery_zones to authenticated;

grant select on pricing.delivery_settings to anon, authenticated;
grant update on pricing.delivery_settings to authenticated;

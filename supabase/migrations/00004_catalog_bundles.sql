-- S1B: catalog.bundles + catalog.bundle_items

-- catalog.bundles (plantilla — sin stock, precio dinámico)
create table if not exists catalog.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  service_fee numeric(12, 2) not null default 0,
  quantity int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint bundles_service_fee_non_negative check (service_fee >= 0),
  constraint bundles_quantity_positive check (quantity >= 1)
);

create index if not exists bundles_active_idx
  on catalog.bundles (created_at desc)
  where deleted_at is null and is_active = true;

alter table catalog.bundles enable row level security;

create policy "bundles_select_public"
  on catalog.bundles for select
  using (is_active = true and deleted_at is null);

create policy "bundles_select_staff"
  on catalog.bundles for select
  using (core.is_staff());

create policy "bundles_insert_staff"
  on catalog.bundles for insert
  with check (core.is_staff());

create policy "bundles_update_staff"
  on catalog.bundles for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "bundles_delete_staff"
  on catalog.bundles for delete
  using (core.is_staff());

create trigger bundles_set_updated_at
  before update on catalog.bundles
  for each row execute function core.set_updated_at();

-- catalog.bundle_items (composición — units_per_person por producto)
create table if not exists catalog.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references catalog.bundles (id) on delete cascade,
  product_id uuid not null references catalog.products (id),
  units_per_person int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bundle_items_bundle_product_unique unique (bundle_id, product_id),
  constraint bundle_items_units_per_person_positive check (units_per_person >= 1)
);

create index if not exists bundle_items_bundle_id_idx on catalog.bundle_items (bundle_id);
create index if not exists bundle_items_product_id_idx on catalog.bundle_items (product_id);

alter table catalog.bundle_items enable row level security;

create policy "bundle_items_select_public"
  on catalog.bundle_items for select
  using (
    exists (
      select 1
      from catalog.bundles b
      where b.id = bundle_id
        and b.is_active = true
        and b.deleted_at is null
    )
  );

create policy "bundle_items_select_staff"
  on catalog.bundle_items for select
  using (core.is_staff());

create policy "bundle_items_insert_staff"
  on catalog.bundle_items for insert
  with check (core.is_staff());

create policy "bundle_items_update_staff"
  on catalog.bundle_items for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "bundle_items_delete_staff"
  on catalog.bundle_items for delete
  using (core.is_staff());

create trigger bundle_items_set_updated_at
  before update on catalog.bundle_items
  for each row execute function core.set_updated_at();

-- API grants (DECISIONS #21)
grant select on catalog.bundles, catalog.bundle_items to anon, authenticated;
grant insert, update, delete on catalog.bundles, catalog.bundle_items to authenticated;

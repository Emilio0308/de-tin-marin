-- S1A: catalog.categories + catalog.products

-- catalog.categories
create table if not exists catalog.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  slug text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint categories_slug_unique unique (slug)
);

create index if not exists categories_active_idx
  on catalog.categories (sort_order)
  where deleted_at is null and is_active = true;

alter table catalog.categories enable row level security;

create policy "categories_select_public"
  on catalog.categories for select
  using (is_active = true and deleted_at is null);

create policy "categories_select_staff"
  on catalog.categories for select
  using (core.is_staff());

create policy "categories_insert_staff"
  on catalog.categories for insert
  with check (core.is_staff());

create policy "categories_update_staff"
  on catalog.categories for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "categories_delete_staff"
  on catalog.categories for delete
  using (core.is_staff());

create trigger categories_set_updated_at
  before update on catalog.categories
  for each row execute function core.set_updated_at();

-- catalog.products
create table if not exists catalog.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  description text,
  slug text not null,
  brand text,
  prices jsonb not null default '{"normal":{"netPrice":0,"igv":0,"subtotal":0},"suggested":{},"fantasy":{}}',
  image_url text,
  stock_quantity int not null default 0,
  category_id uuid not null references catalog.categories (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint products_sku_unique unique (sku),
  constraint products_slug_unique unique (slug),
  constraint products_stock_quantity_non_negative check (stock_quantity >= 0)
);

create index if not exists products_category_id_idx on catalog.products (category_id);
create index if not exists products_active_idx
  on catalog.products (category_id)
  where deleted_at is null and is_active = true;

alter table catalog.products enable row level security;

create policy "products_select_public"
  on catalog.products for select
  using (is_active = true and deleted_at is null);

create policy "products_select_staff"
  on catalog.products for select
  using (core.is_staff());

create policy "products_insert_staff"
  on catalog.products for insert
  with check (core.is_staff());

create policy "products_update_staff"
  on catalog.products for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "products_delete_staff"
  on catalog.products for delete
  using (core.is_staff());

create trigger products_set_updated_at
  before update on catalog.products
  for each row execute function core.set_updated_at();

-- S4-12: storefront settings (reglas generales de tienda) — singleton tipado

create table if not exists core.storefront_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  free_delivery boolean not null default false,
  free_pickup_point boolean not null default false,
  free_fulfillment_starts_at timestamptz,
  free_fulfillment_ends_at timestamptz,
  min_order_subtotal numeric(12, 2) not null default 0,
  announcement_enabled boolean not null default false,
  announcement_message text,
  updated_at timestamptz not null default now(),
  constraint storefront_settings_singleton_key unique (singleton_key),
  constraint storefront_settings_min_order_nonneg check (min_order_subtotal >= 0),
  constraint storefront_settings_free_window_check check (
    free_fulfillment_starts_at is null
    or free_fulfillment_ends_at is null
    or free_fulfillment_ends_at > free_fulfillment_starts_at
  )
);

insert into core.storefront_settings (singleton_key)
values ('default')
on conflict (singleton_key) do nothing;

alter table core.storefront_settings enable row level security;

create policy "storefront_settings_select_public"
  on core.storefront_settings for select
  using (true);

create policy "storefront_settings_update_staff"
  on core.storefront_settings for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger storefront_settings_set_updated_at
  before update on core.storefront_settings
  for each row execute function core.set_updated_at();

grant select on core.storefront_settings to anon, authenticated;
grant update on core.storefront_settings to authenticated;

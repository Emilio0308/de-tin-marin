-- S4-03: hero settings + hero images for ecommerce home customization

-- core.hero_settings (singleton)
create table if not exists core.hero_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  display_mode text not null default 'static',
  updated_at timestamptz not null default now(),
  constraint hero_settings_singleton_key unique (singleton_key),
  constraint hero_settings_display_mode_check check (display_mode in ('static', 'carousel'))
);

insert into core.hero_settings (singleton_key, display_mode)
values ('default', 'static')
on conflict (singleton_key) do nothing;

alter table core.hero_settings enable row level security;

create policy "hero_settings_select_public"
  on core.hero_settings for select
  using (true);

create policy "hero_settings_update_staff"
  on core.hero_settings for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger hero_settings_set_updated_at
  before update on core.hero_settings
  for each row execute function core.set_updated_at();

-- core.hero_images
create table if not exists core.hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint hero_images_ends_after_starts check (ends_at > starts_at)
);

create index if not exists hero_images_active_sort_idx
  on core.hero_images (sort_order, starts_at)
  where deleted_at is null;

alter table core.hero_images enable row level security;

create policy "hero_images_select_public"
  on core.hero_images for select
  using (deleted_at is null);

create policy "hero_images_select_staff"
  on core.hero_images for select
  using (core.is_staff());

create policy "hero_images_insert_staff"
  on core.hero_images for insert
  with check (core.is_staff());

create policy "hero_images_update_staff"
  on core.hero_images for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "hero_images_delete_staff"
  on core.hero_images for delete
  using (core.is_staff());

create trigger hero_images_set_updated_at
  before update on core.hero_images
  for each row execute function core.set_updated_at();

-- API grants (DECISIONS #21)
grant select on core.hero_settings to anon, authenticated;
grant update on core.hero_settings to authenticated;

grant select on core.hero_images to anon, authenticated;
grant insert, update, delete on core.hero_images to authenticated;

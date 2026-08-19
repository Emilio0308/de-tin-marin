-- S4-07: about page story image (ecommerce /nosotros)

create table if not exists core.about_page_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  image_url text,
  updated_at timestamptz not null default now(),
  constraint about_page_settings_singleton_key unique (singleton_key)
);

insert into core.about_page_settings (singleton_key, image_url)
values ('default', null)
on conflict (singleton_key) do nothing;

alter table core.about_page_settings enable row level security;

create policy "about_page_settings_select_public"
  on core.about_page_settings for select
  using (true);

create policy "about_page_settings_update_staff"
  on core.about_page_settings for update
  using (core.is_staff())
  with check (core.is_staff());

create trigger about_page_settings_set_updated_at
  before update on core.about_page_settings
  for each row execute function core.set_updated_at();

grant select on core.about_page_settings to anon, authenticated;
grant update on core.about_page_settings to authenticated;

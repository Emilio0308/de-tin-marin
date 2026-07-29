-- Catalog cache version (timestamp) for ecommerce invalidation (DECISIONS #32)

create table if not exists catalog.catalog_cache_meta (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  version_at timestamptz not null default now(),
  constraint catalog_cache_meta_singleton_key unique (singleton_key)
);

insert into catalog.catalog_cache_meta (singleton_key, version_at)
values ('default', now())
on conflict (singleton_key) do nothing;

alter table catalog.catalog_cache_meta enable row level security;

create policy "catalog_cache_meta_select_public"
  on catalog.catalog_cache_meta for select
  using (true);

create policy "catalog_cache_meta_update_staff"
  on catalog.catalog_cache_meta for update
  using (core.is_staff())
  with check (core.is_staff());

create or replace function catalog.bump_catalog_version()
returns timestamptz
language plpgsql
security definer
set search_path = catalog, core
as $$
declare
  v_at timestamptz;
begin
  if not core.is_staff() then
    raise exception 'FORBIDDEN'
      using errcode = '42501';
  end if;

  update catalog.catalog_cache_meta
  set version_at = now()
  where singleton_key = 'default'
  returning version_at into v_at;

  if not found then
    insert into catalog.catalog_cache_meta (singleton_key, version_at)
    values ('default', now())
    returning version_at into v_at;
  end if;

  return v_at;
end;
$$;

revoke all on function catalog.bump_catalog_version() from public;
grant execute on function catalog.bump_catalog_version() to authenticated;

grant select on catalog.catalog_cache_meta to anon, authenticated;
grant update on catalog.catalog_cache_meta to authenticated;

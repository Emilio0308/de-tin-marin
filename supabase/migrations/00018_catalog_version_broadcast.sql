-- Broadcast catalog version via Realtime when bumped (cost-efficient: 1 event per mutate)

create or replace function catalog.bump_catalog_version()
returns timestamptz
language plpgsql
security definer
set search_path = catalog, core, realtime, public
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

  -- Public Broadcast: storefront clients subscribe without auth.
  -- Failures must not roll back the version bump.
  begin
    perform realtime.send(
      jsonb_build_object('versionAt', v_at),
      'catalog_version_changed',
      'catalog-version',
      false
    );
  exception
    when others then
      raise warning 'catalog.bump_catalog_version broadcast failed: %', sqlerrm;
  end;

  return v_at;
end;
$$;

revoke all on function catalog.bump_catalog_version() from public;
grant execute on function catalog.bump_catalog_version() to authenticated;

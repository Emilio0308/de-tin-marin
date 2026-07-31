begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.hero_settings'::regclass),
  'RLS enabled on core.hero_settings'
);

select ok(
  (select count(*)::int from core.hero_settings where singleton_key = 'default') = 1,
  'default hero_settings row exists'
);

select * from finish();
rollback;

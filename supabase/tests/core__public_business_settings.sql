begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.public_business_settings'::regclass),
  'RLS enabled on core.public_business_settings'
);

select ok(
  (select count(*)::int from core.public_business_settings where singleton_key = 'default') = 1,
  'default public_business_settings row exists'
);

select * from finish();
rollback;

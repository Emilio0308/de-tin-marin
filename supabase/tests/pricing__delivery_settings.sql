begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'pricing.delivery_settings'::regclass),
  'RLS enabled on pricing.delivery_settings'
);

select ok(
  (select count(*)::int from pricing.delivery_settings where singleton_key = 'default') = 1,
  'default delivery_settings row exists'
);

select * from finish();
rollback;

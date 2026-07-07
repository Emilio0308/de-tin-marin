begin;
select plan(3);

select ok(
  (select relrowsecurity from pg_class where oid = 'pricing.delivery_zones'::regclass),
  'RLS enabled on pricing.delivery_zones'
);

select throws_ok(
  $$ insert into pricing.delivery_zones (district, fee)
     values ('Test District', 5) $$,
  '42501',
  null,
  'anon cannot insert delivery_zones'
);

select ok(
  (select count(*)::int from pricing.delivery_zones where district = 'Piura') >= 1,
  'Piura delivery zone seeded'
);

select * from finish();
rollback;

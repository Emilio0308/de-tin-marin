begin;
select plan(4);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.bundles'::regclass),
  'RLS enabled on catalog.bundles'
);

select throws_ok(
  $$ insert into catalog.bundles (name, service_fee, quantity)
     values ('Test Bundle', 10, 5) $$,
  '42501',
  null,
  'anon cannot insert bundles'
);

select ok(
  (select conname from pg_constraint where conname = 'bundles_quantity_positive') is not null,
  'bundles_quantity_positive constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'bundles_service_fee_non_negative') is not null,
  'bundles_service_fee_non_negative constraint exists'
);

select * from finish();
rollback;

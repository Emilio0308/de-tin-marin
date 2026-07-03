begin;
select plan(4);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.bundle_items'::regclass),
  'RLS enabled on catalog.bundle_items'
);

select throws_ok(
  $$ insert into catalog.bundle_items (bundle_id, product_id, units_per_person)
     values (gen_random_uuid(), gen_random_uuid(), 1) $$,
  '42501',
  null,
  'anon cannot insert bundle_items'
);

select ok(
  (select conname from pg_constraint where conname = 'bundle_items_bundle_product_unique') is not null,
  'bundle_items_bundle_product_unique constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'bundle_items_units_per_person_positive') is not null,
  'bundle_items_units_per_person_positive constraint exists'
);

select * from finish();
rollback;

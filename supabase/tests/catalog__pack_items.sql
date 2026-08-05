begin;
select plan(5);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.pack_items'::regclass),
  'RLS enabled on catalog.pack_items'
);

select ok(
  (select conname from pg_constraint where conname = 'pack_items_package_quantity_nonnegative') is not null,
  'pack_items_package_quantity_nonnegative constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'pack_items_unit_quantity_nonnegative') is not null,
  'pack_items_unit_quantity_nonnegative constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'pack_items_quantity_sum_positive') is not null,
  'pack_items_quantity_sum_positive constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'pack_items_pack_product_unique') is not null,
  'pack_items_pack_product_unique constraint exists'
);

select * from finish();
rollback;

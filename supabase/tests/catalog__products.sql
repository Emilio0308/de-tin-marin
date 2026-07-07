begin;
select plan(7);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.products'::regclass),
  'RLS enabled on catalog.products'
);

select throws_ok(
  $$ insert into catalog.products (sku, name, slug, category_id)
     values ('SKU-TEST', 'Test', 'test-product', gen_random_uuid()) $$,
  '42501',
  null,
  'anon cannot insert products'
);

select ok(
  (select conname from pg_constraint where conname = 'products_sku_unique') is not null,
  'products_sku_unique constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'products_product_type_check') is not null,
  'products_product_type_check constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'products_items_per_package_positive') is not null,
  'products_items_per_package_positive constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'products_stock_sealed_packages_non_negative') is not null,
  'products_stock_sealed_packages_non_negative constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'products_stock_loose_base_units_non_negative') is not null,
  'products_stock_loose_base_units_non_negative constraint exists'
);

select * from finish();
rollback;

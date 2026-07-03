begin;
select plan(3);

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

select * from finish();
rollback;

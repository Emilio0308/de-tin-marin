begin;
select plan(3);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.surprise_containers'::regclass),
  'RLS enabled on catalog.surprise_containers'
);

select throws_ok(
  $$ insert into catalog.surprise_containers (sku, name, prices)
     values ('TEST-ENV', 'Test Envase', '{"netPrice": 5, "igv": 0.76, "subtotal": 4.24}'::jsonb) $$,
  '42501',
  null,
  'anon cannot insert surprise_containers'
);

select ok(
  (select conname from pg_constraint where conname = 'surprise_containers_stock_non_negative') is not null,
  'surprise_containers_stock_non_negative constraint exists'
);

select * from finish();
rollback;

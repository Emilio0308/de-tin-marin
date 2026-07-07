begin;
select plan(4);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.bundles'::regclass),
  'RLS enabled on catalog.bundles'
);

select throws_ok(
  $$ insert into catalog.bundles (name, quantity, container_id)
     values ('Test Bundle', 5, gen_random_uuid()) $$,
  '42501',
  null,
  'anon cannot insert bundles'
);

select ok(
  (select conname from pg_constraint where conname = 'bundles_quantity_positive') is not null,
  'bundles_quantity_positive constraint exists'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'catalog'
      and table_name = 'bundles'
      and column_name = 'container_id'
  ),
  'bundles.container_id column exists'
);

select * from finish();
rollback;

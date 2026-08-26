begin;
select plan(7);

select has_function(
  'catalog',
  'list_public_bundles',
  array['integer', 'integer', 'text', 'text'],
  'list_public_bundles exists'
);

select has_function(
  'catalog',
  'list_public_packs',
  array['integer', 'integer', 'text', 'text'],
  'list_public_packs exists'
);

select ok(
  (select prosecdef from pg_proc
    where oid = 'catalog.list_public_bundles(integer, integer, text, text)'::regprocedure) = false,
  'list_public_bundles is SECURITY INVOKER'
);

select ok(
  (select prosecdef from pg_proc
    where oid = 'catalog.list_public_packs(integer, integer, text, text)'::regprocedure) = false,
  'list_public_packs is SECURITY INVOKER'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'pricing'
      and tablename = 'campaigns'
      and policyname = 'campaigns_select_public'
  ),
  'campaigns_select_public policy exists'
);

select is(
  catalog.list_public_bundles(1, 12, null, 'name_asc') ->> 'total',
  '0',
  'list_public_bundles total is 0 when empty'
);

select is(
  catalog.list_public_packs(1, 12, null, 'name_asc') ->> 'total',
  '0',
  'list_public_packs total is 0 when empty'
);

select * from finish();
rollback;

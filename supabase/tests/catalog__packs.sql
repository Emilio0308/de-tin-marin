begin;
select plan(5);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.packs'::regclass),
  'RLS enabled on catalog.packs'
);

select throws_ok(
  $$ insert into catalog.packs (
       sku, name, slug, prices
     ) values (
       'PACK-ANON',
       'Anon Pack',
       'anon-pack',
       '{"normal":{"netPrice":10,"igv":1.53,"subtotal":8.47},"reference":{"netPrice":10,"igv":1.53,"subtotal":8.47}}'::jsonb
     ) $$,
  '42501',
  null,
  'anon cannot insert packs'
);

select ok(
  (select conname from pg_constraint where conname = 'packs_prices_normal_gte_reference') is not null,
  'packs_prices_normal_gte_reference constraint exists'
);

select ok(
  (select conname from pg_constraint where conname = 'packs_purchase_max_gte_min') is not null,
  'packs_purchase_max_gte_min constraint exists'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'catalog'
      and table_name = 'packs'
      and column_name = 'campaign_id'
  ),
  'packs.campaign_id column exists'
);

select * from finish();
rollback;

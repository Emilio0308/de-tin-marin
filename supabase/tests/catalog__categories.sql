begin;
select plan(3);

select ok(
  (select relrowsecurity from pg_class where oid = 'catalog.categories'::regclass),
  'RLS enabled on catalog.categories'
);

select throws_ok(
  $$ insert into catalog.categories (name, slug) values ('test', 'test-anon') $$,
  '42501',
  null,
  'anon cannot insert categories'
);

select ok(
  (select count(*) = 0 from catalog.categories where slug = 'inactive-cat' and is_active = false),
  'public cannot read inactive categories without staff policy'
);

select * from finish();
rollback;

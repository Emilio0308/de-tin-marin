begin;
select plan(1);

select ok(
  (select relrowsecurity from pg_class where oid = 'core.settings'::regclass),
  'RLS enabled on core.settings'
);

select * from finish();
rollback;

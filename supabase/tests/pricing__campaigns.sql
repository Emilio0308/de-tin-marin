begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'pricing.campaigns'::regclass),
  'RLS enabled on pricing.campaigns'
);

select throws_ok(
  $$ insert into pricing.campaigns (name, percentage, starts_at, ends_at)
     values ('Test', 10, now(), now() + interval '1 day') $$,
  '42501',
  null,
  'anon cannot insert campaigns'
);

select * from finish();
rollback;

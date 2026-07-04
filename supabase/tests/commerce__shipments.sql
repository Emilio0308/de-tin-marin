begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'commerce.shipments'::regclass),
  'RLS enabled on commerce.shipments'
);

select throws_ok(
  $$ insert into commerce.shipments (
       order_id,
       status
     ) values (
       gen_random_uuid(),
       'pending'
     ) $$,
  '42501',
  null,
  'anon cannot insert shipments'
);

select * from finish();
rollback;

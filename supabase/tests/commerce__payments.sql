begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'commerce.payments'::regclass),
  'RLS enabled on commerce.payments'
);

select throws_ok(
  $$ insert into commerce.payments (
       order_id,
       amount,
       status
     ) values (
       gen_random_uuid(),
       10,
       'confirmed'
     ) $$,
  '42501',
  null,
  'anon cannot insert payments'
);

select * from finish();
rollback;

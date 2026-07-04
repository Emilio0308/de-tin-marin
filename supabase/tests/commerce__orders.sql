begin;
select plan(2);

select ok(
  (select relrowsecurity from pg_class where oid = 'commerce.orders'::regclass),
  'RLS enabled on commerce.orders'
);

select throws_ok(
  $$ insert into commerce.orders (
       order_number,
       shopping_cart,
       subtotal,
       total
     ) values (
       'TM-TEST-0001',
       '{"lines":[{"type":"product","productId":"00000000-0000-0000-0000-000000000001","sku":"X","name":"Test","quantity":1,"unitPrice":1,"lineTotal":1}]}'::jsonb,
       1,
       1
     ) $$,
  '42501',
  null,
  'anon cannot insert orders'
);

select * from finish();
rollback;

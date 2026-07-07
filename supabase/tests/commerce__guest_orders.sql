begin;
select plan(4);

select ok(
  (
    select count(*)::int > 0
    from pg_policies
    where schemaname = 'commerce'
      and tablename = 'orders'
      and policyname = 'orders_insert_guest'
  ),
  'orders_insert_guest policy exists'
);

select lives_ok(
  $$ insert into commerce.orders (
       order_number,
       status,
       payment_status,
       customer_id,
       shopping_cart,
       subtotal,
       total
     ) values (
       'TM-GUEST-TEST-0001',
       'pending_payment',
       'pending',
       null,
       '{"lines":[{"type":"product","productId":"00000000-0000-0000-0000-000000000001","sku":"X","name":"Test","quantity":1,"unitPrice":1,"lineTotal":1}]}'::jsonb,
       1,
       1
     ) $$,
  'anon can insert guest pending_payment order'
);

select throws_ok(
  $$ insert into commerce.orders (
       order_number,
       status,
       payment_status,
       customer_id,
       shopping_cart,
       subtotal,
       total
     ) values (
       'TM-GUEST-TEST-0002',
       'paid',
       'pending',
       null,
       '{"lines":[{"type":"product","productId":"00000000-0000-0000-0000-000000000001","sku":"X","name":"Test","quantity":1,"unitPrice":1,"lineTotal":1}]}'::jsonb,
       1,
       1
     ) $$,
  '42501',
  null,
  'anon cannot insert guest order with paid status'
);

select is(
  (select count(*)::int from commerce.orders where order_number = 'TM-GUEST-TEST-0001'),
  0,
  'anon cannot select inserted guest orders'
);

select * from finish();
rollback;

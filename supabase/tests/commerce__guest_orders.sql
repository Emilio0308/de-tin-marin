begin;
select plan(11);

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
       contact,
       shopping_cart,
       subtotal,
       total
     ) values (
       'TM-GUEST-TEST-0001',
       'pending_payment',
       'pending',
       null,
       '{"name":"Ana","lastName":"Garcia","phone":"999","email":"guest@example.com"}'::jsonb,
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

insert into commerce.orders (
  order_number,
  status,
  payment_status,
  customer_id,
  contact,
  fulfillment,
  shopping_cart,
  subtotal,
  shipping_total,
  total
) values (
  'TM-GUEST-RPC-0001',
  'pending_payment',
  'pending',
  null,
  '{"name":"Luis","lastName":"Perez","phone":"999","email":"lookup@example.com"}'::jsonb,
  '{"method":"delivery","deliveryAddress":{"recipientName":"Luis Perez","line1":"Av 1","district":"Piura","city":"Piura","province":"Piura","reference":null,"phone":"999"}}'::jsonb,
  '{"lines":[{"type":"product","productId":"00000000-0000-0000-0000-000000000001","sku":"X","name":"Test","quantity":1,"unitPrice":10,"lineTotal":10}]}'::jsonb,
  10,
  8,
  18
);

select ok(
  commerce.get_guest_order('TM-GUEST-RPC-0001', 'lookup@example.com') is not null,
  'get_guest_order returns order for matching email'
);

select ok(
  (commerce.get_guest_order('TM-GUEST-RPC-0001', 'lookup@example.com') ->> 'orderNumber')
    = 'TM-GUEST-RPC-0001',
  'get_guest_order returns orderNumber'
);

select is(
  commerce.get_guest_order('TM-GUEST-RPC-0001', 'wrong@example.com'),
  null,
  'get_guest_order returns null for email mismatch'
);

select ok(
  commerce.get_guest_order('TM-GUEST-RPC-0001', 'LOOKUP@EXAMPLE.COM') is not null,
  'get_guest_order matches email case-insensitively'
);

select ok(
  (
    select proname
    from pg_proc
    where proname = 'insert_guest_order'
      and pronamespace = 'commerce'::regnamespace
  ) is not null,
  'commerce.insert_guest_order exists'
);

select lives_ok(
  $$ select commerce.insert_guest_order(
       '{"name":"Ana","lastName":"Garcia","phone":"999","email":"insert@example.com"}'::jsonb,
       '{"method":"delivery","deliveryAddress":{"recipientName":"Ana Garcia","line1":"Av 1","district":"Piura","city":"Piura","province":"Piura","reference":null,"phone":"999"}}'::jsonb,
       '{"lines":[{"type":"product","productId":"00000000-0000-0000-0000-000000000001","sku":"X","name":"Test","quantity":1,"unitPrice":1,"lineTotal":1}]}'::jsonb,
       1,
       0,
       8,
       9,
       '{"subtotal":1,"discountTotal":0,"shippingTotal":8,"total":9}'::jsonb,
       '{"mapPin":{"lat":-5.1,"lng":-80.6}}'::jsonb
     ) $$,
  'anon can create guest order via insert_guest_order RPC'
);

select ok(
  (
    select (commerce.insert_guest_order(
      '{"name":"Ana","lastName":"Garcia","phone":"999","email":"insert2@example.com"}'::jsonb,
      '{"method":"delivery","deliveryAddress":{"recipientName":"Ana Garcia","line1":"Av 1","district":"Piura","city":"Piura","province":"Piura","reference":null,"phone":"999"}}'::jsonb,
      '{"lines":[{"type":"product","productId":"00000000-0000-0000-0000-000000000001","sku":"X","name":"Test","quantity":1,"unitPrice":1,"lineTotal":1}]}'::jsonb,
      1, 0, 8, 9,
      '{"subtotal":1,"discountTotal":0,"shippingTotal":8,"total":9}'::jsonb,
      '{}'::jsonb
    ) ->> 'orderNumber') is not null
  ),
  'insert_guest_order returns orderNumber'
);

select * from finish();
rollback;

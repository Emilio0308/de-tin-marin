begin;
select plan(8);

select ok(
  (
    select proname
    from pg_proc
    where proname = 'restock_stock_for_order'
      and pronamespace = 'commerce'::regnamespace
  ) is not null,
  'commerce.restock_stock_for_order exists'
);

select ok(
  (
    select proname
    from pg_proc
    where proname = 'cancel_order_with_restock'
      and pronamespace = 'commerce'::regnamespace
  ) is not null,
  'commerce.cancel_order_with_restock exists'
);

-- Cancel pending_payment: status only, stock untouched
do $$
declare
  v_category_id uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  v_product_id uuid := 'bbbbbbbb-0001-0001-0001-000000000011';
  v_order_id uuid := 'bbbbbbbb-0001-0001-0001-000000000021';
  v_result jsonb;
begin
  insert into catalog.categories (id, name, slug)
  values (v_category_id, 'Cancel Cat', 'cancel-cat-test')
  on conflict (id) do nothing;

  insert into catalog.products (
    id,
    sku,
    name,
    slug,
    category_id,
    prices,
    stock_sealed_packages,
    stock_loose_base_units,
    items_per_package,
    product_type
  )
  values (
    v_product_id,
    'CANCEL-PEND',
    'Cancel Pending Product',
    'cancel-pending-product',
    v_category_id,
    '{"normal":{"netPrice":10,"igv":1.53,"subtotal":8.47},"unit":{"netPrice":1,"igv":0.15,"subtotal":0.85}}'::jsonb,
    4,
    0,
    10,
    'package'
  )
  on conflict (id) do update
  set
    stock_sealed_packages = 4,
    stock_loose_base_units = 0,
    items_per_package = 10;

  insert into commerce.orders (
    id,
    order_number,
    status,
    payment_status,
    shopping_cart,
    subtotal,
    total
  )
  values (
    v_order_id,
    'TM-CANCEL-PEND-001',
    'pending_payment',
    'pending',
    jsonb_build_object(
      'lines',
      jsonb_build_array(
        jsonb_build_object(
          'type', 'product',
          'productId', v_product_id,
          'sku', 'CANCEL-PEND',
          'name', 'Cancel Pending Product',
          'packageQuantity', 2,
          'unitQuantity', 0,
          'packagePrice', 1,
          'unitPrice', 1,
          'lineTotal', 2
        )
      )
    ),
    20,
    20
  )
  on conflict (id) do update
  set
    status = 'pending_payment',
    payment_status = 'pending',
    shopping_cart = excluded.shopping_cart;

  v_result := commerce.cancel_order_with_restock(
    v_order_id,
    'bbbbbbbb-0001-0001-0001-000000000099',
    null
  );

  if (v_result ->> 'status') <> 'cancelled'
    or (v_result ->> 'restocked')::boolean <> false
  then
    raise exception 'pending cancel result unexpected: %', v_result;
  end if;
end;
$$;

select is(
  (
    select status
    from commerce.orders
    where id = 'bbbbbbbb-0001-0001-0001-000000000021'
  ),
  'cancelled',
  'pending_payment cancel → cancelled'
);

select is(
  (
    select stock_sealed_packages
    from catalog.products
    where id = 'bbbbbbbb-0001-0001-0001-000000000011'
  ),
  4,
  'pending_payment cancel does not change stock'
);

-- Cancel paid: refund + restock product
do $$
declare
  v_category_id uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  v_product_id uuid := 'bbbbbbbb-0001-0001-0001-000000000012';
  v_order_id uuid := 'bbbbbbbb-0001-0001-0001-000000000022';
  v_payment_id uuid := 'bbbbbbbb-0001-0001-0001-000000000032';
  v_result jsonb;
begin
  insert into catalog.products (
    id,
    sku,
    name,
    slug,
    category_id,
    prices,
    stock_sealed_packages,
    stock_loose_base_units,
    items_per_package,
    product_type
  )
  values (
    v_product_id,
    'CANCEL-PAID',
    'Cancel Paid Product',
    'cancel-paid-product',
    v_category_id,
    '{"normal":{"netPrice":10,"igv":1.53,"subtotal":8.47},"unit":{"netPrice":1,"igv":0.15,"subtotal":0.85}}'::jsonb,
    5,
    0,
    10,
    'package'
  )
  on conflict (id) do update
  set
    stock_sealed_packages = 5,
    stock_loose_base_units = 0,
    items_per_package = 10;

  insert into commerce.orders (
    id,
    order_number,
    status,
    payment_status,
    shopping_cart,
    subtotal,
    total
  )
  values (
    v_order_id,
    'TM-CANCEL-PAID-001',
    'pending_payment',
    'pending',
    jsonb_build_object(
      'lines',
      jsonb_build_array(
        jsonb_build_object(
          'type', 'product',
          'productId', v_product_id,
          'sku', 'CANCEL-PAID',
          'name', 'Cancel Paid Product',
          'packageQuantity', 2,
          'unitQuantity', 0,
          'packagePrice', 1,
          'unitPrice', 1,
          'lineTotal', 2
        )
      )
    ),
    20,
    20
  )
  on conflict (id) do update
  set
    status = 'pending_payment',
    payment_status = 'pending',
    shopping_cart = excluded.shopping_cart;

  perform commerce.deduct_stock_for_order(v_order_id);

  update commerce.orders
  set status = 'paid', payment_status = 'confirmed'
  where id = v_order_id;

  insert into commerce.payments (
    id,
    order_id,
    amount,
    status,
    method,
    confirmed_at
  )
  values (
    v_payment_id,
    v_order_id,
    20,
    'confirmed',
    'internal',
    now()
  )
  on conflict (id) do update
  set status = 'confirmed';

  v_result := commerce.cancel_order_with_restock(
    v_order_id,
    'bbbbbbbb-0001-0001-0001-000000000099',
    'test cancel'
  );

  if (v_result ->> 'restocked')::boolean is distinct from true then
    raise exception 'paid cancel should restock: %', v_result;
  end if;

  -- Second call idempotent
  v_result := commerce.cancel_order_with_restock(
    v_order_id,
    'bbbbbbbb-0001-0001-0001-000000000099',
    null
  );

  if (v_result ->> 'idempotent')::boolean is distinct from true
    or (v_result ->> 'restocked')::boolean is distinct from false
  then
    raise exception 'second cancel should be idempotent: %', v_result;
  end if;
end;
$$;

select is(
  (
    select status
    from commerce.orders
    where id = 'bbbbbbbb-0001-0001-0001-000000000022'
  ),
  'cancelled',
  'paid cancel → cancelled'
);

select is(
  (
    select payment_status
    from commerce.orders
    where id = 'bbbbbbbb-0001-0001-0001-000000000022'
  ),
  'refunded',
  'paid cancel → payment_status refunded'
);

select is(
  (
    select status
    from commerce.payments
    where id = 'bbbbbbbb-0001-0001-0001-000000000032'
  ),
  'refunded',
  'paid cancel refunds confirmed payment'
);

select is(
  (
    select stock_sealed_packages
    from catalog.products
    where id = 'bbbbbbbb-0001-0001-0001-000000000012'
  ),
  5,
  'paid cancel restocks sealed packages (2 packages returned via normalize)'
);

select * from finish();
rollback;

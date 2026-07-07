begin;
select plan(10);

-- Helpers (pure math — no auth)
select is(
  (
    select sealed_packages
    from catalog._deduct_product_base_units(5, 0, 10, 25)
  ),
  2,
  'Lay''s deduct: 5 tiras, need 25 → 2 sealed left'
);

select is(
  (
    select loose_base_units
    from catalog._deduct_product_base_units(5, 0, 10, 25)
  ),
  5,
  'Lay''s deduct: 5 tiras, need 25 → 5 loose left'
);

select is(
  (
    select loose_base_units
    from catalog._deduct_product_base_units(0, 30, 10, 25)
  ),
  5,
  'deduct consumes loose first: 30 loose, need 25 → 5 loose left'
);

select is(
  (
    select count(*)
    from catalog._deduct_product_base_units(1, 0, 10, 15)
  ),
  0::bigint,
  'insufficient product stock returns no rows'
);

select ok(
  (
    select proname
    from pg_proc
    where proname = 'deduct_stock_for_order'
      and pronamespace = 'commerce'::regnamespace
  ) is not null,
  'commerce.deduct_stock_for_order exists'
);

select ok(
  (
    select proname
    from pg_proc
    where proname = 'confirm_payment_with_stock_deduct'
      and pronamespace = 'commerce'::regnamespace
  ) is not null,
  'commerce.confirm_payment_with_stock_deduct exists'
);

-- Integration: product line deduct
do $$
declare
  v_category_id uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  v_product_id uuid := 'aaaaaaaa-0001-0001-0001-000000000011';
  v_order_id uuid := 'aaaaaaaa-0001-0001-0001-000000000021';
begin
  insert into catalog.categories (id, name, slug)
  values (v_category_id, 'Test Cat', 'test-cat-deduct')
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
    'LAYS-TEST',
    'Lay''s Test',
    'lays-test-deduct',
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
    'TM-DEDUCT-TEST-001',
    'pending_payment',
    'pending',
    jsonb_build_object(
      'lines',
      jsonb_build_array(
        jsonb_build_object(
          'type', 'product',
          'productId', v_product_id,
          'sku', 'LAYS-TEST',
          'name', 'Lay''s Test',
          'quantity', 25,
          'unitPrice', 1,
          'lineTotal', 25
        )
      )
    ),
    25,
    25
  )
  on conflict (id) do update
  set
    status = 'pending_payment',
    payment_status = 'pending',
    shopping_cart = excluded.shopping_cart;

  perform commerce.deduct_stock_for_order(v_order_id);
end;
$$;

select is(
  (
    select stock_sealed_packages
    from catalog.products
    where id = 'aaaaaaaa-0001-0001-0001-000000000011'
  ),
  2,
  'order deduct updates product sealed packages'
);

select is(
  (
    select stock_loose_base_units
    from catalog.products
    where id = 'aaaaaaaa-0001-0001-0001-000000000011'
  ),
  5,
  'order deduct updates product loose units'
);

-- Insufficient stock rolls back deduct attempt
select throws_like(
  $$
    do $inner$
    declare
      v_order_id uuid := 'aaaaaaaa-0001-0001-0001-000000000022';
      v_product_id uuid := 'aaaaaaaa-0001-0001-0001-000000000011';
    begin
      update catalog.products
      set stock_sealed_packages = 1, stock_loose_base_units = 0
      where id = v_product_id;

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
        'TM-DEDUCT-TEST-002',
        'pending_payment',
        'pending',
        jsonb_build_object(
          'lines',
          jsonb_build_array(
            jsonb_build_object(
              'type', 'product',
              'productId', v_product_id,
              'sku', 'LAYS-TEST',
              'name', 'Lay''s Test',
              'quantity', 15,
              'unitPrice', 1,
              'lineTotal', 15
            )
          )
        ),
        15,
        15
      )
      on conflict (id) do update
      set
        status = 'pending_payment',
        payment_status = 'pending',
        shopping_cart = excluded.shopping_cart;

      perform commerce.deduct_stock_for_order(v_order_id);
    end;
    $inner$;
  $$,
  '%INSUFFICIENT_STOCK:product:LAYS-TEST%',
  'insufficient product stock raises INSUFFICIENT_STOCK'
);

select is(
  (
    select status
    from commerce.orders
    where id = 'aaaaaaaa-0001-0001-0001-000000000022'
  ),
  'pending_payment',
  'order stays pending_payment when deduct fails'
);

-- Container deduct on bundle line
do $$
declare
  v_category_id uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  v_product_id uuid := 'aaaaaaaa-0001-0001-0001-000000000011';
  v_container_id uuid := 'aaaaaaaa-0001-0001-0001-000000000031';
  v_order_id uuid := 'aaaaaaaa-0001-0001-0001-000000000023';
begin
  update catalog.products
  set stock_sealed_packages = 5, stock_loose_base_units = 0
  where id = v_product_id;

  insert into catalog.surprise_containers (id, sku, name, prices, stock_quantity)
  values (
    v_container_id,
    'CAJA-TEST',
    'Caja test',
    '{"netPrice": 5, "igv": 0.76, "subtotal": 4.24}'::jsonb,
    10
  )
  on conflict (id) do update set stock_quantity = 10;

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
    'TM-DEDUCT-TEST-003',
    'pending_payment',
    'pending',
    jsonb_build_object(
      'lines',
      jsonb_build_array(
        jsonb_build_object(
          'type', 'bundle',
          'bundleId', 'aaaaaaaa-0001-0001-0001-000000000041',
          'name', 'Sorpresa test',
          'quantity', 3,
          'lineTotal', 30,
          'container', jsonb_build_object(
            'containerId', v_container_id,
            'sku', 'CAJA-TEST',
            'name', 'Caja test',
            'unitPrice', 5
          ),
          'components', jsonb_build_array(
            jsonb_build_object(
              'productId', v_product_id,
              'productName', 'Lay''s Test',
              'sku', 'LAYS-TEST',
              'quantityPerUnit', 1,
              'totalQuantity', 3,
              'unitPrice', 1
            )
          )
        )
      )
    ),
    30,
    30
  )
  on conflict (id) do update
  set
    status = 'pending_payment',
    payment_status = 'pending',
    shopping_cart = excluded.shopping_cart;

  perform commerce.deduct_stock_for_order(v_order_id);
end;
$$;

select is(
  (
    select stock_quantity
    from catalog.surprise_containers
    where id = 'aaaaaaaa-0001-0001-0001-000000000031'
  ),
  7,
  'bundle deduct subtracts container stock (10 - 3 = 7)'
);

select * from finish();
rollback;

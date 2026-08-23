-- Status CHECK for in_transit / awaiting_pickup (00030)

begin;
select plan(3);

select ok(
  (
    select conname
    from pg_constraint
    where conrelid = 'commerce.orders'::regclass
      and conname = 'orders_status_check'
  ) is not null,
  'orders_status_check exists'
);

do $$
declare
  v_order_id uuid := 'cccccccc-0001-0001-0001-000000000001';
begin
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
    'TM-STATUS-IN-TRANSIT',
    'in_transit',
    'confirmed',
    '{"lines":[]}'::jsonb,
    10,
    10
  )
  on conflict (id) do update
  set status = 'in_transit', payment_status = 'confirmed';
end;
$$;

select is(
  (
    select status
    from commerce.orders
    where id = 'cccccccc-0001-0001-0001-000000000001'
  ),
  'in_transit',
  'in_transit is a valid order status'
);

do $$
declare
  v_order_id uuid := 'cccccccc-0001-0001-0001-000000000002';
  v_result jsonb;
begin
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
    'TM-STATUS-AWAIT',
    'awaiting_pickup',
    'confirmed',
    '{"lines":[]}'::jsonb,
    10,
    10
  )
  on conflict (id) do update
  set status = 'awaiting_pickup', payment_status = 'confirmed';

  v_result := commerce.cancel_order_with_restock(
    v_order_id,
    'cccccccc-0001-0001-0001-000000000099',
    null
  );

  if (v_result ->> 'status') <> 'cancelled' then
    raise exception 'awaiting_pickup cancel unexpected: %', v_result;
  end if;
end;
$$;

select is(
  (
    select status
    from commerce.orders
    where id = 'cccccccc-0001-0001-0001-000000000002'
  ),
  'cancelled',
  'cancel_order_with_restock accepts awaiting_pickup'
);

select * from finish();
rollback;

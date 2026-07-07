-- S2A: deduct stock on payment confirmation (products sealed/loose + surprise containers)

create or replace function catalog._normalize_product_stock(
  p_sealed int,
  p_loose int,
  p_items int
)
returns table (sealed_packages int, loose_base_units int)
language plpgsql
immutable
as $$
declare
  v_items int := greatest(1, p_items);
  v_extra int;
begin
  if p_loose < v_items then
    return query select p_sealed, p_loose;
    return;
  end if;

  v_extra := p_loose / v_items;
  return query select p_sealed + v_extra, p_loose % v_items;
end;
$$;

create or replace function catalog._deduct_product_base_units(
  p_sealed int,
  p_loose int,
  p_items int,
  p_need int
)
returns table (sealed_packages int, loose_base_units int)
language plpgsql
immutable
as $$
declare
  v_items int := greatest(1, p_items);
  v_remaining int := p_need;
  v_loose int := p_loose;
  v_sealed int := p_sealed;
  v_from_loose int;
  v_take int;
  v_norm int;
  v_norm_loose int;
begin
  if p_need <= 0 then
    select n.sealed_packages, n.loose_base_units
      into v_norm, v_norm_loose
    from catalog._normalize_product_stock(v_sealed, v_loose, v_items) n;
    return query select v_norm, v_norm_loose;
    return;
  end if;

  v_from_loose := least(v_remaining, v_loose);
  v_remaining := v_remaining - v_from_loose;
  v_loose := v_loose - v_from_loose;

  while v_remaining > 0 loop
    if v_sealed <= 0 then
      return;
    end if;

    v_sealed := v_sealed - 1;
    v_take := least(v_remaining, v_items);
    v_remaining := v_remaining - v_take;
    v_loose := v_loose + (v_items - v_take);
  end loop;

  select n.sealed_packages, n.loose_base_units
    into v_norm, v_norm_loose
  from catalog._normalize_product_stock(v_sealed, v_loose, v_items) n;

  return query select v_norm, v_norm_loose;
end;
$$;

create or replace function commerce.deduct_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = commerce, catalog, core, public
as $$
declare
  v_order commerce.orders%rowtype;
  v_line jsonb;
  v_component jsonb;
  v_product_id uuid;
  v_container_id uuid;
  v_need int;
  v_sku text;
  v_product catalog.products%rowtype;
  v_container catalog.surprise_containers%rowtype;
  v_deduct int;
  v_deduct_loose int;
  v_product_needs jsonb := '{}'::jsonb;
  v_container_needs jsonb := '{}'::jsonb;
  v_entry jsonb;
begin
  select *
    into v_order
  from commerce.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'NOT_FOUND'
      using errcode = 'P0002';
  end if;

  if v_order.status = 'paid' then
    raise exception 'ALREADY_PAID'
      using errcode = 'P0001';
  end if;

  for v_line in
    select value
    from jsonb_array_elements(v_order.shopping_cart -> 'lines')
  loop
    if v_line ->> 'type' = 'product' then
      v_product_id := (v_line ->> 'productId')::uuid;
      v_need := coalesce((v_line ->> 'quantity')::int, 0);
      v_sku := coalesce(v_line ->> 'sku', v_product_id::text);

      v_entry := v_product_needs -> v_product_id::text;
      v_product_needs := jsonb_set(
        v_product_needs,
        array[v_product_id::text],
        jsonb_build_object(
          'need',
          coalesce((v_entry ->> 'need')::int, 0) + v_need,
          'sku',
          coalesce(v_entry ->> 'sku', v_sku)
        ),
        true
      );
    elsif v_line ->> 'type' = 'bundle' then
      for v_component in
        select value
        from jsonb_array_elements(v_line -> 'components')
      loop
        v_product_id := (v_component ->> 'productId')::uuid;
        v_need := coalesce((v_component ->> 'totalQuantity')::int, 0);
        v_sku := coalesce(v_component ->> 'sku', v_product_id::text);

        v_entry := v_product_needs -> v_product_id::text;
        v_product_needs := jsonb_set(
          v_product_needs,
          array[v_product_id::text],
          jsonb_build_object(
            'need',
            coalesce((v_entry ->> 'need')::int, 0) + v_need,
            'sku',
            coalesce(v_entry ->> 'sku', v_sku)
          ),
          true
        );
      end loop;

      if v_line -> 'container' is not null
        and v_line -> 'container' != 'null'::jsonb
      then
        v_container_id := (v_line -> 'container' ->> 'containerId')::uuid;
        v_need := coalesce((v_line ->> 'quantity')::int, 0);
        v_sku := coalesce(
          v_line -> 'container' ->> 'sku',
          v_container_id::text
        );

        v_entry := v_container_needs -> v_container_id::text;
        v_container_needs := jsonb_set(
          v_container_needs,
          array[v_container_id::text],
          jsonb_build_object(
            'need',
            coalesce((v_entry ->> 'need')::int, 0) + v_need,
            'sku',
            coalesce(v_entry ->> 'sku', v_sku)
          ),
          true
        );
      end if;
    end if;
  end loop;

  for v_product_id, v_entry in
    select key::uuid, value
    from jsonb_each(v_product_needs)
  loop
    v_need := (v_entry ->> 'need')::int;
    v_sku := v_entry ->> 'sku';

    select *
      into v_product
    from catalog.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'INSUFFICIENT_STOCK:product:%', v_sku
        using errcode = 'P0001';
    end if;

    select d.sealed_packages, d.loose_base_units
      into v_deduct, v_deduct_loose
    from catalog._deduct_product_base_units(
      v_product.stock_sealed_packages,
      v_product.stock_loose_base_units,
      v_product.items_per_package,
      v_need
    ) d;

    if not found then
      raise exception 'INSUFFICIENT_STOCK:product:%', coalesce(v_product.sku, v_sku)
        using errcode = 'P0001';
    end if;

    update catalog.products
    set
      stock_sealed_packages = v_deduct,
      stock_loose_base_units = v_deduct_loose
    where id = v_product_id;
  end loop;

  for v_container_id, v_entry in
    select key::uuid, value
    from jsonb_each(v_container_needs)
  loop
    v_need := (v_entry ->> 'need')::int;
    v_sku := v_entry ->> 'sku';

    select *
      into v_container
    from catalog.surprise_containers
    where id = v_container_id
    for update;

    if not found or v_container.stock_quantity < v_need then
      raise exception 'INSUFFICIENT_STOCK:container:%', coalesce(v_container.sku, v_sku)
        using errcode = 'P0001';
    end if;

    update catalog.surprise_containers
    set stock_quantity = stock_quantity - v_need
    where id = v_container_id;
  end loop;
end;
$$;

create or replace function commerce.confirm_payment_with_stock_deduct(
  p_order_id uuid,
  p_staff_user_id uuid,
  p_notes text default null,
  p_payment_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = commerce, catalog, core, public
as $$
declare
  v_order commerce.orders%rowtype;
  v_payment_id uuid;
  v_confirmed_at timestamptz := now();
  v_payment_methods jsonb;
  v_new_method jsonb;
begin
  if not core.is_staff()
    and current_user not in ('postgres', 'supabase_admin')
  then
    raise exception 'FORBIDDEN'
      using errcode = '42501';
  end if;

  select *
    into v_order
  from commerce.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'NOT_FOUND'
      using errcode = 'P0002';
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception 'ORDER_NOT_PENDING'
      using errcode = 'P0001';
  end if;

  if v_order.payment_status = 'confirmed' then
    raise exception 'ALREADY_CONFIRMED'
      using errcode = 'P0001';
  end if;

  perform commerce.deduct_stock_for_order(p_order_id);

  insert into commerce.payments (
    order_id,
    amount,
    currency_code,
    status,
    method,
    confirmed_by,
    notes,
    confirmed_at
  )
  values (
    p_order_id,
    v_order.total,
    'PEN',
    'confirmed',
    'internal',
    p_staff_user_id,
    p_notes,
    v_confirmed_at
  )
  returning id into v_payment_id;

  v_new_method := jsonb_build_object(
    'type', 'internal',
    'reference', p_payment_reference,
    'confirmedAt', v_confirmed_at
  );

  v_payment_methods := coalesce(v_order.payment_methods, '[]'::jsonb);
  if jsonb_typeof(v_payment_methods) <> 'array' then
    v_payment_methods := '[]'::jsonb;
  end if;
  v_payment_methods := v_payment_methods || jsonb_build_array(v_new_method);

  update commerce.orders
  set
    status = 'paid',
    payment_status = 'confirmed',
    payment_methods = v_payment_methods
  where id = p_order_id;

  return jsonb_build_object(
    'orderId', p_order_id,
    'paymentId', v_payment_id,
    'status', 'paid'
  );
end;
$$;

revoke all on function catalog._normalize_product_stock(int, int, int) from public;
revoke all on function catalog._deduct_product_base_units(int, int, int, int) from public;

revoke all on function commerce.deduct_stock_for_order(uuid) from public;
grant execute on function commerce.deduct_stock_for_order(uuid) to authenticated;

revoke all on function commerce.confirm_payment_with_stock_deduct(uuid, uuid, text, text) from public;
grant execute on function commerce.confirm_payment_with_stock_deduct(uuid, uuid, text, text) to authenticated;

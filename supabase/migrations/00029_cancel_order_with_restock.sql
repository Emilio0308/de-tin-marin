-- Atomic cancel: refund confirmed payments + restock (inverse of deduct) + cancelled

create or replace function commerce.restock_stock_for_order(p_order_id uuid)
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
  v_qty int;
  v_units_qty int;
  v_sku text;
  v_product catalog.products%rowtype;
  v_container catalog.surprise_containers%rowtype;
  v_need int;
  v_presentation_qty int;
  v_base_units int;
  v_new_sealed int;
  v_new_loose int;
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

  for v_line in
    select value
    from jsonb_array_elements(v_order.shopping_cart -> 'lines')
  loop
    if v_line ->> 'type' = 'product' then
      v_product_id := (v_line ->> 'productId')::uuid;
      v_qty := coalesce((v_line ->> 'packageQuantity')::int, 0);
      v_units_qty := coalesce((v_line ->> 'unitQuantity')::int, 0);
      v_sku := coalesce(v_line ->> 'sku', v_product_id::text);

      v_entry := v_product_needs -> v_product_id::text;
      v_product_needs := jsonb_set(
        v_product_needs,
        array[v_product_id::text],
        jsonb_build_object(
          'presentationQuantity',
          coalesce((v_entry ->> 'presentationQuantity')::int, 0) + v_qty,
          'baseUnits',
          coalesce((v_entry ->> 'baseUnits')::int, 0) + v_units_qty,
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
        v_qty := coalesce((v_component ->> 'totalQuantity')::int, 0);
        v_sku := coalesce(v_component ->> 'sku', v_product_id::text);

        v_entry := v_product_needs -> v_product_id::text;
        v_product_needs := jsonb_set(
          v_product_needs,
          array[v_product_id::text],
          jsonb_build_object(
            'presentationQuantity',
            coalesce((v_entry ->> 'presentationQuantity')::int, 0),
            'baseUnits',
            coalesce((v_entry ->> 'baseUnits')::int, 0) + v_qty,
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
        v_qty := coalesce((v_line ->> 'quantity')::int, 0);
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
            coalesce((v_entry ->> 'need')::int, 0) + v_qty,
            'sku',
            coalesce(v_entry ->> 'sku', v_sku)
          ),
          true
        );
      end if;
    elsif v_line ->> 'type' = 'pack' then
      for v_component in
        select value
        from jsonb_array_elements(v_line -> 'components')
      loop
        v_product_id := (v_component ->> 'productId')::uuid;
        v_qty := coalesce(
          (v_component ->> 'totalPackages')::int,
          coalesce((v_component ->> 'packageQuantity')::int, 0)
            * coalesce((v_line ->> 'quantity')::int, 0)
        );
        v_units_qty := coalesce(
          (v_component ->> 'totalUnits')::int,
          coalesce((v_component ->> 'unitQuantity')::int, 0)
            * coalesce((v_line ->> 'quantity')::int, 0)
        );
        v_sku := coalesce(v_component ->> 'sku', v_product_id::text);

        v_entry := v_product_needs -> v_product_id::text;
        v_product_needs := jsonb_set(
          v_product_needs,
          array[v_product_id::text],
          jsonb_build_object(
            'presentationQuantity',
            coalesce((v_entry ->> 'presentationQuantity')::int, 0) + v_qty,
            'baseUnits',
            coalesce((v_entry ->> 'baseUnits')::int, 0) + v_units_qty,
            'sku',
            coalesce(v_entry ->> 'sku', v_sku)
          ),
          true
        );
      end loop;
    end if;
  end loop;

  for v_product_id, v_entry in
    select key::uuid, value
    from jsonb_each(v_product_needs)
  loop
    v_presentation_qty := coalesce((v_entry ->> 'presentationQuantity')::int, 0);
    v_base_units := coalesce((v_entry ->> 'baseUnits')::int, 0);
    v_sku := v_entry ->> 'sku';

    select *
      into v_product
    from catalog.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'NOT_FOUND:product:%', v_sku
        using errcode = 'P0002';
    end if;

    if v_product.product_type = 'unit' then
      v_need := v_presentation_qty + v_base_units;

      update catalog.products
      set stock_loose_base_units = stock_loose_base_units + v_need
      where id = v_product_id;
    else
      v_need :=
        v_presentation_qty * greatest(1, v_product.items_per_package)
        + v_base_units;

      -- v1: return base units to loose, then normalize into sealed packs
      select n.sealed_packages, n.loose_base_units
        into v_new_sealed, v_new_loose
      from catalog._normalize_product_stock(
        v_product.stock_sealed_packages,
        v_product.stock_loose_base_units + v_need,
        v_product.items_per_package
      ) n;

      update catalog.products
      set
        stock_sealed_packages = v_new_sealed,
        stock_loose_base_units = v_new_loose
      where id = v_product_id;
    end if;
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

    if not found then
      raise exception 'NOT_FOUND:container:%', v_sku
        using errcode = 'P0002';
    end if;

    update catalog.surprise_containers
    set stock_quantity = stock_quantity + v_need
    where id = v_container_id;
  end loop;
end;
$$;

create or replace function commerce.cancel_order_with_restock(
  p_order_id uuid,
  p_staff_user_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = commerce, catalog, core, public
as $$
declare
  v_order commerce.orders%rowtype;
  v_restocked boolean := false;
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

  -- Idempotent: already cancelled → no second restock
  if v_order.status = 'cancelled' then
    return jsonb_build_object(
      'orderId', p_order_id,
      'status', 'cancelled',
      'restocked', false,
      'idempotent', true
    );
  end if;

  if v_order.status = 'pending_payment' then
    update commerce.orders
    set status = 'cancelled'
    where id = p_order_id;

    return jsonb_build_object(
      'orderId', p_order_id,
      'status', 'cancelled',
      'restocked', false,
      'idempotent', false
    );
  end if;

  if v_order.status not in ('paid', 'preparing', 'ready') then
    raise exception 'INVALID_TRANSITION'
      using errcode = 'P0001';
  end if;

  update commerce.payments
  set
    status = 'refunded',
    notes = case
      when p_notes is null or length(trim(p_notes)) = 0 then notes
      when notes is null or length(trim(notes)) = 0 then p_notes
      else notes || E'\n' || p_notes
    end,
    updated_at = now()
  where order_id = p_order_id
    and status = 'confirmed';

  perform commerce.restock_stock_for_order(p_order_id);
  v_restocked := true;

  update commerce.orders
  set
    status = 'cancelled',
    payment_status = 'refunded'
  where id = p_order_id;

  return jsonb_build_object(
    'orderId', p_order_id,
    'status', 'cancelled',
    'restocked', v_restocked,
    'idempotent', false
  );
end;
$$;

revoke all on function commerce.restock_stock_for_order(uuid) from public;
grant execute on function commerce.restock_stock_for_order(uuid) to authenticated;

revoke all on function commerce.cancel_order_with_restock(uuid, uuid, text) from public;
grant execute on function commerce.cancel_order_with_restock(uuid, uuid, text) to authenticated;

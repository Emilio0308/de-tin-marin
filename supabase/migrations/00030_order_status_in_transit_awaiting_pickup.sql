-- Order statuses: in_transit + awaiting_pickup (fulfillment-aware logistics)

alter table commerce.orders
  drop constraint if exists orders_status_check;

alter table commerce.orders
  add constraint orders_status_check
  check (status in (
    'pending_payment',
    'paid',
    'preparing',
    'ready',
    'awaiting_pickup',
    'in_transit',
    'delivered',
    'completed',
    'cancelled'
  ));

-- Allow cancel from awaiting_pickup / in_transit (stock already deducted at paid)
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

  if v_order.status not in (
    'paid',
    'preparing',
    'ready',
    'awaiting_pickup',
    'in_transit'
  ) then
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

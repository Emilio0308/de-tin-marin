-- Admin order totals: surcharge (recargo) at order header; guest stays 0 via default.

alter table commerce.orders
  add column if not exists surcharge_total numeric(12, 2) not null default 0;

alter table commerce.orders
  drop constraint if exists orders_totals_non_negative;

alter table commerce.orders
  add constraint orders_totals_non_negative
  check (
    subtotal >= 0
    and discount_total >= 0
    and surcharge_total >= 0
    and shipping_total >= 0
    and total >= 0
  );

-- Guest insert: column defaults to 0; keep signature unchanged.
create or replace function commerce.insert_guest_order(
  p_contact jsonb,
  p_fulfillment jsonb,
  p_shopping_cart jsonb,
  p_subtotal numeric,
  p_discount_total numeric,
  p_shipping_total numeric,
  p_total numeric,
  p_pricing_snapshot jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = commerce, public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_date date := (timezone('America/Lima', now()))::date;
begin
  if p_contact is null
    or p_fulfillment is null
    or p_shopping_cart is null
    or p_shopping_cart -> 'lines' is null
    or jsonb_typeof(p_shopping_cart -> 'lines') <> 'array'
    or jsonb_array_length(p_shopping_cart -> 'lines') < 1
  then
    raise exception 'VALIDATION'
      using errcode = 'P0001';
  end if;

  if coalesce(p_fulfillment ->> 'method', '') <> 'delivery' then
    raise exception 'VALIDATION'
      using errcode = 'P0001';
  end if;

  if p_fulfillment -> 'deliveryAddress' is null
    or p_fulfillment -> 'deliveryAddress' = 'null'::jsonb
  then
    raise exception 'VALIDATION'
      using errcode = 'P0001';
  end if;

  v_order_number := commerce.next_order_number_for_date(v_date);

  insert into commerce.orders (
    order_number,
    status,
    payment_status,
    customer_id,
    contact,
    fulfillment,
    shopping_cart,
    payment_methods,
    subtotal,
    discount_total,
    surcharge_total,
    shipping_total,
    total,
    pricing_snapshot,
    currency_code,
    metadata
  )
  values (
    v_order_number,
    'pending_payment',
    'pending',
    null,
    p_contact,
    p_fulfillment,
    p_shopping_cart,
    '[]'::jsonb,
    p_subtotal,
    coalesce(p_discount_total, 0),
    0,
    coalesce(p_shipping_total, 0),
    p_total,
    coalesce(p_pricing_snapshot, '{}'::jsonb),
    'PEN',
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'orderNumber', v_order_number
  );
end;
$$;

revoke all on function commerce.insert_guest_order(
  jsonb, jsonb, jsonb, numeric, numeric, numeric, numeric, jsonb, jsonb
) from public;

grant execute on function commerce.insert_guest_order(
  jsonb, jsonb, jsonb, numeric, numeric, numeric, numeric, jsonb, jsonb
) to anon, authenticated;

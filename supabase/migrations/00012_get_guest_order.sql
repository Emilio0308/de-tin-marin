-- S3A-4: guest order lookup by order number + email (SECURITY DEFINER)

create or replace function commerce.get_guest_order(
  p_order_number text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = commerce, core, public
as $$
declare
  v_order commerce.orders%rowtype;
  v_email text := lower(trim(p_email));
begin
  if p_order_number is null
    or trim(p_order_number) = ''
    or v_email is null
    or v_email = ''
  then
    return null;
  end if;

  select *
    into v_order
  from commerce.orders
  where order_number = trim(p_order_number)
    and customer_id is null
    and lower(trim(contact ->> 'email')) = v_email;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'paymentStatus', v_order.payment_status,
    'subtotal', v_order.subtotal,
    'shippingTotal', v_order.shipping_total,
    'total', v_order.total,
    'createdAt', v_order.created_at,
    'fulfillment', v_order.fulfillment,
    'shoppingCart', v_order.shopping_cart
  );
end;
$$;

grant execute on function commerce.get_guest_order(text, text) to anon, authenticated;

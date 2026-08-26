-- S4-08: pickup points catalog + guest order fulfillment branches

alter table pricing.delivery_settings
  add column if not exists pickup_points_enabled boolean not null default true;

-- pricing.pickup_points
create table if not exists pricing.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  fee numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pickup_points_name_unique unique (name),
  constraint pickup_points_fee_non_negative check (fee >= 0),
  constraint pickup_points_lat_bounds check (lat >= -90 and lat <= 90),
  constraint pickup_points_lng_bounds check (lng >= -180 and lng <= 180)
);

create index if not exists pickup_points_active_sort_idx
  on pricing.pickup_points (sort_order, name)
  where is_active = true;

alter table pricing.pickup_points enable row level security;

create policy "pickup_points_select_public"
  on pricing.pickup_points for select
  using (is_active = true);

create policy "pickup_points_select_staff"
  on pricing.pickup_points for select
  using (core.is_staff());

create policy "pickup_points_insert_staff"
  on pricing.pickup_points for insert
  with check (core.is_staff());

create policy "pickup_points_update_staff"
  on pricing.pickup_points for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "pickup_points_delete_staff"
  on pricing.pickup_points for delete
  using (core.is_staff());

create trigger pickup_points_set_updated_at
  before update on pricing.pickup_points
  for each row execute function core.set_updated_at();

grant select on pricing.pickup_points to anon, authenticated;
grant insert, update, delete on pricing.pickup_points to authenticated;

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
  v_method text := coalesce(p_fulfillment ->> 'method', '');
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

  if v_method = 'delivery' then
    if p_fulfillment -> 'deliveryAddress' is null
      or p_fulfillment -> 'deliveryAddress' = 'null'::jsonb
    then
      raise exception 'VALIDATION'
        using errcode = 'P0001';
    end if;

    if p_fulfillment -> 'pickupPoint' is not null
      and p_fulfillment -> 'pickupPoint' <> 'null'::jsonb
    then
      raise exception 'VALIDATION'
        using errcode = 'P0001';
    end if;
  elsif v_method = 'pickup_point' then
    if p_fulfillment -> 'pickupPoint' is null
      or p_fulfillment -> 'pickupPoint' = 'null'::jsonb
      or coalesce(p_fulfillment -> 'pickupPoint' ->> 'id', '') = ''
      or coalesce(p_fulfillment -> 'pickupPoint' ->> 'name', '') = ''
      or (p_fulfillment -> 'pickupPoint' ->> 'lat') is null
      or (p_fulfillment -> 'pickupPoint' ->> 'lng') is null
      or (p_fulfillment -> 'pickupPoint' ->> 'fee') is null
    then
      raise exception 'VALIDATION'
        using errcode = 'P0001';
    end if;

    if p_fulfillment -> 'deliveryAddress' is not null
      and p_fulfillment -> 'deliveryAddress' <> 'null'::jsonb
    then
      raise exception 'VALIDATION'
        using errcode = 'P0001';
    end if;
  else
    raise exception 'VALIDATION'
      using errcode = 'P0001';
  end if;

  if coalesce(p_shipping_total, -1) < 0 then
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

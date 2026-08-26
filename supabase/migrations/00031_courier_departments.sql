-- S4-11: courier (envío por agencia) — catálogo departamentos + provincias jsonb

alter table pricing.delivery_settings
  add column if not exists courier_enabled boolean not null default false;

create table if not exists pricing.courier_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provinces jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courier_departments_name_unique unique (name),
  constraint courier_departments_provinces_is_array check (
    jsonb_typeof(provinces) = 'array'
  )
);

create index if not exists courier_departments_active_sort_idx
  on pricing.courier_departments (sort_order, name)
  where is_active = true;

alter table pricing.courier_departments enable row level security;

create policy "courier_departments_select_public"
  on pricing.courier_departments for select
  using (is_active = true);

create policy "courier_departments_select_staff"
  on pricing.courier_departments for select
  using (core.is_staff());

create policy "courier_departments_insert_staff"
  on pricing.courier_departments for insert
  with check (core.is_staff());

create policy "courier_departments_update_staff"
  on pricing.courier_departments for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "courier_departments_delete_staff"
  on pricing.courier_departments for delete
  using (core.is_staff());

create trigger courier_departments_set_updated_at
  before update on pricing.courier_departments
  for each row execute function core.set_updated_at();

grant select on pricing.courier_departments to anon, authenticated;
grant insert, update, delete on pricing.courier_departments to authenticated;

-- Seed: inactivo por defecto. Piura dept. sin provincia Piura (cubierta por delivery local).
insert into pricing.courier_departments (name, provinces, is_active, sort_order)
values
  (
    'Lima',
    '[
      {"slug":"lima","name":"Lima","enabled":false},
      {"slug":"barranca","name":"Barranca","enabled":false},
      {"slug":"cajatambo","name":"Cajatambo","enabled":false},
      {"slug":"canta","name":"Canta","enabled":false},
      {"slug":"canete","name":"Cañete","enabled":false},
      {"slug":"huaral","name":"Huaral","enabled":false},
      {"slug":"huarochiri","name":"Huarochirí","enabled":false},
      {"slug":"huaura","name":"Huaura","enabled":false},
      {"slug":"oyon","name":"Oyón","enabled":false},
      {"slug":"yauyos","name":"Yauyos","enabled":false}
    ]'::jsonb,
    false,
    10
  ),
  (
    'Lambayeque',
    '[
      {"slug":"chiclayo","name":"Chiclayo","enabled":false},
      {"slug":"ferrenafe","name":"Ferreñafe","enabled":false},
      {"slug":"lambayeque","name":"Lambayeque","enabled":false}
    ]'::jsonb,
    false,
    20
  ),
  (
    'Piura',
    '[
      {"slug":"ayabaca","name":"Ayabaca","enabled":false},
      {"slug":"huancabamba","name":"Huancabamba","enabled":false},
      {"slug":"morropon","name":"Morropón","enabled":false},
      {"slug":"paita","name":"Paita","enabled":false},
      {"slug":"sechura","name":"Sechura","enabled":false},
      {"slug":"sullana","name":"Sullana","enabled":false},
      {"slug":"talara","name":"Talara","enabled":false}
    ]'::jsonb,
    false,
    30
  )
on conflict (name) do nothing;

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

    if p_fulfillment -> 'courier' is not null
      and p_fulfillment -> 'courier' <> 'null'::jsonb
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

    if p_fulfillment -> 'courier' is not null
      and p_fulfillment -> 'courier' <> 'null'::jsonb
    then
      raise exception 'VALIDATION'
        using errcode = 'P0001';
    end if;
  elsif v_method = 'courier' then
    if p_fulfillment -> 'courier' is null
      or p_fulfillment -> 'courier' = 'null'::jsonb
      or p_fulfillment -> 'courier' -> 'destination' is null
      or p_fulfillment -> 'courier' -> 'recipient' is null
      or coalesce(
        p_fulfillment -> 'courier' -> 'destination' ->> 'departmentId',
        ''
      ) = ''
      or coalesce(
        p_fulfillment -> 'courier' -> 'destination' ->> 'departmentName',
        ''
      ) = ''
      or coalesce(
        p_fulfillment -> 'courier' -> 'destination' ->> 'provinceSlug',
        ''
      ) = ''
      or coalesce(
        p_fulfillment -> 'courier' -> 'destination' ->> 'provinceName',
        ''
      ) = ''
      or coalesce(p_fulfillment -> 'courier' -> 'recipient' ->> 'dni', '') = ''
      or coalesce(
        p_fulfillment -> 'courier' -> 'recipient' ->> 'fullName',
        ''
      ) = ''
      or coalesce(
        p_fulfillment -> 'courier' -> 'recipient' ->> 'agencyAddress',
        ''
      ) = ''
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

    if p_fulfillment -> 'pickupPoint' is not null
      and p_fulfillment -> 'pickupPoint' <> 'null'::jsonb
    then
      raise exception 'VALIDATION'
        using errcode = 'P0001';
    end if;

    if coalesce(p_shipping_total, -1) <> 0 then
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

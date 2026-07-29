-- S1F: catalog.packs + catalog.pack_items + deduct pack lines

-- catalog.packs (combo — sin stock propio; precio reference + normal)
create table if not exists catalog.packs (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  description text,
  slug text not null,
  image_url text,
  prices jsonb not null,
  campaign_id uuid references pricing.campaigns (id),
  purchase_min_quantity int not null default 1,
  purchase_max_quantity int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint packs_sku_unique unique (sku),
  constraint packs_slug_unique unique (slug),
  constraint packs_purchase_min_positive check (purchase_min_quantity >= 1),
  constraint packs_purchase_max_gte_min check (purchase_max_quantity >= purchase_min_quantity),
  constraint packs_prices_normal_gte_reference check (
    (prices -> 'normal' ->> 'netPrice')::numeric
      >= (prices -> 'reference' ->> 'netPrice')::numeric
  )
);

create index if not exists packs_active_idx
  on catalog.packs (created_at desc)
  where deleted_at is null and is_active = true;

create index if not exists packs_campaign_id_idx
  on catalog.packs (campaign_id)
  where campaign_id is not null;

alter table catalog.packs enable row level security;

create policy "packs_select_public"
  on catalog.packs for select
  using (is_active = true and deleted_at is null);

create policy "packs_select_staff"
  on catalog.packs for select
  using (core.is_staff());

create policy "packs_insert_staff"
  on catalog.packs for insert
  with check (core.is_staff());

create policy "packs_update_staff"
  on catalog.packs for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "packs_delete_staff"
  on catalog.packs for delete
  using (core.is_staff());

create trigger packs_set_updated_at
  before update on catalog.packs
  for each row execute function core.set_updated_at();

-- catalog.pack_items (BOM — package_quantity presentaciones por combo)
create table if not exists catalog.pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references catalog.packs (id) on delete cascade,
  product_id uuid not null references catalog.products (id),
  package_quantity int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pack_items_pack_product_unique unique (pack_id, product_id),
  constraint pack_items_package_quantity_positive check (package_quantity >= 1)
);

create index if not exists pack_items_pack_id_idx on catalog.pack_items (pack_id);
create index if not exists pack_items_product_id_idx on catalog.pack_items (product_id);

alter table catalog.pack_items enable row level security;

create policy "pack_items_select_public"
  on catalog.pack_items for select
  using (
    exists (
      select 1
      from catalog.packs p
      where p.id = pack_id
        and p.is_active = true
        and p.deleted_at is null
    )
  );

create policy "pack_items_select_staff"
  on catalog.pack_items for select
  using (core.is_staff());

create policy "pack_items_insert_staff"
  on catalog.pack_items for insert
  with check (core.is_staff());

create policy "pack_items_update_staff"
  on catalog.pack_items for update
  using (core.is_staff())
  with check (core.is_staff());

create policy "pack_items_delete_staff"
  on catalog.pack_items for delete
  using (core.is_staff());

create trigger pack_items_set_updated_at
  before update on catalog.pack_items
  for each row execute function core.set_updated_at();

grant select on catalog.packs, catalog.pack_items to anon, authenticated;
grant insert, update, delete on catalog.packs, catalog.pack_items to authenticated;

-- Extend deduct: pack components → presentationQuantity (totalPackages)
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
  v_qty int;
  v_sku text;
  v_product catalog.products%rowtype;
  v_container catalog.surprise_containers%rowtype;
  v_need int;
  v_presentation_qty int;
  v_base_units int;
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
      v_qty := coalesce((v_line ->> 'quantity')::int, 0);
      v_sku := coalesce(v_line ->> 'sku', v_product_id::text);

      v_entry := v_product_needs -> v_product_id::text;
      v_product_needs := jsonb_set(
        v_product_needs,
        array[v_product_id::text],
        jsonb_build_object(
          'presentationQuantity',
          coalesce((v_entry ->> 'presentationQuantity')::int, 0) + v_qty,
          'baseUnits',
          coalesce((v_entry ->> 'baseUnits')::int, 0),
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
        v_sku := coalesce(v_component ->> 'sku', v_product_id::text);

        v_entry := v_product_needs -> v_product_id::text;
        v_product_needs := jsonb_set(
          v_product_needs,
          array[v_product_id::text],
          jsonb_build_object(
            'presentationQuantity',
            coalesce((v_entry ->> 'presentationQuantity')::int, 0) + v_qty,
            'baseUnits',
            coalesce((v_entry ->> 'baseUnits')::int, 0),
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
      raise exception 'INSUFFICIENT_STOCK:product:%', v_sku
        using errcode = 'P0001';
    end if;

    if v_product.product_type = 'unit' then
      v_need := v_presentation_qty + v_base_units;

      v_deduct_loose := catalog._deduct_unit_product_loose(
        v_product.stock_loose_base_units,
        v_need
      );

      if v_deduct_loose is null then
        raise exception 'INSUFFICIENT_STOCK:product:%', coalesce(v_product.sku, v_sku)
          using errcode = 'P0001';
      end if;

      update catalog.products
      set stock_loose_base_units = v_deduct_loose
      where id = v_product_id;
    else
      v_need :=
        v_presentation_qty * greatest(1, v_product.items_per_package)
        + v_base_units;

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

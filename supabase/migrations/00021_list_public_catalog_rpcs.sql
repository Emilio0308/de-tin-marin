-- S3A-1-R: paginated public catalog RPCs for bundles and packs.
-- Product lists use PostgREST count + range in the app repository.

-- Public read of campaigns (grant already existed; RLS policy was staff-only).
-- Needed so storefront can resolve pack finalPrice and pack list sort.
create policy "campaigns_select_public"
  on pricing.campaigns for select
  using (true);

-- Round money to 2 decimals (parity with @de-tin-marin/shared roundMoney).
create or replace function catalog._round_money(p_value numeric)
returns numeric
language sql
immutable
as $$
  select round(coalesce(p_value, 0), 2);
$$;

create or replace function catalog._bundle_list_total(p_bundle catalog.bundles)
returns numeric
language sql
stable
security invoker
set search_path = catalog, public
as $$
  select catalog._round_money(
    p_bundle.quantity * (
      coalesce(
        (
          select (sc.prices ->> 'netPrice')::numeric
          from catalog.surprise_containers sc
          where sc.id = p_bundle.container_id
            and sc.is_active = true
            and sc.deleted_at is null
        ),
        0
      )
      + coalesce(
        (
          select catalog._round_money(
            sum(
              coalesce(
                (p.prices -> 'unit' ->> 'netPrice')::numeric,
                (p.prices -> 'normal' ->> 'netPrice')::numeric,
                0
              ) * bi.units_per_person
            )
          )
          from catalog.bundle_items bi
          join catalog.products p on p.id = bi.product_id
          where bi.bundle_id = p_bundle.id
            and p.is_active = true
            and p.deleted_at is null
        ),
        0
      )
    )
  );
$$;

create or replace function catalog.list_public_bundles(
  p_page int default 1,
  p_page_size int default 12,
  p_search text default null,
  p_sort text default 'name_asc'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = catalog, public
as $$
declare
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 48);
  v_offset int;
  v_sort text := coalesce(nullif(trim(p_sort), ''), 'name_asc');
  v_search text := nullif(trim(p_search), '');
  v_total bigint;
  v_ids jsonb;
begin
  v_offset := (v_page - 1) * v_page_size;

  select count(*)::bigint
    into v_total
  from catalog.bundles b
  where b.is_active = true
    and b.deleted_at is null
    and (
      v_search is null
      or b.name ilike '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
    );

  with filtered as (
    select
      b.id as bundle_id,
      b.name as bundle_name,
      catalog._bundle_list_total(b) as list_total
    from catalog.bundles b
    where b.is_active = true
      and b.deleted_at is null
      and (
        v_search is null
        or b.name ilike '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
      )
  ),
  ordered as (
    select f.bundle_id
    from filtered f
    order by
      case when v_sort = 'name_asc' then f.bundle_name end asc nulls last,
      case when v_sort = 'name_desc' then f.bundle_name end desc nulls last,
      case when v_sort = 'price_asc' then f.list_total end asc nulls last,
      case when v_sort = 'price_desc' then f.list_total end desc nulls last,
      f.bundle_id asc
    offset v_offset
    limit v_page_size
  )
  select coalesce(jsonb_agg(o.bundle_id), '[]'::jsonb)
    into v_ids
  from ordered o;

  return jsonb_build_object(
    'total', coalesce(v_total, 0),
    'ids', coalesce(v_ids, '[]'::jsonb)
  );
end;
$$;

create or replace function catalog._pack_list_final_price(p_pack catalog.packs)
returns numeric
language sql
stable
security invoker
set search_path = catalog, pricing, public
as $$
  select
    case
      when c.id is not null
        and c.is_active = true
        and now() >= c.starts_at
        and now() <= c.ends_at
      then catalog._round_money(
        coalesce((p_pack.prices -> 'normal' ->> 'netPrice')::numeric, 0)
        * (1 - (c.percentage / 100.0))
      )
      else catalog._round_money(
        coalesce((p_pack.prices -> 'normal' ->> 'netPrice')::numeric, 0)
      )
    end
  from (select 1) as _
  left join pricing.campaigns c on c.id = p_pack.campaign_id;
$$;

create or replace function catalog.list_public_packs(
  p_page int default 1,
  p_page_size int default 12,
  p_search text default null,
  p_sort text default 'name_asc'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = catalog, pricing, public
as $$
declare
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 48);
  v_offset int;
  v_sort text := coalesce(nullif(trim(p_sort), ''), 'name_asc');
  v_search text := nullif(trim(p_search), '');
  v_total bigint;
  v_ids jsonb;
begin
  v_offset := (v_page - 1) * v_page_size;

  select count(*)::bigint
    into v_total
  from catalog.packs p
  where p.is_active = true
    and p.deleted_at is null
    and (
      v_search is null
      or p.name ilike '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
      or p.sku ilike '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
    );

  with filtered as (
    select
      p.id as pack_id,
      p.name as pack_name,
      catalog._pack_list_final_price(p) as list_final_price
    from catalog.packs p
    where p.is_active = true
      and p.deleted_at is null
      and (
        v_search is null
        or p.name ilike '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
        or p.sku ilike '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
      )
  ),
  ordered as (
    select f.pack_id
    from filtered f
    order by
      case when v_sort = 'name_asc' then f.pack_name end asc nulls last,
      case when v_sort = 'name_desc' then f.pack_name end desc nulls last,
      case when v_sort = 'price_asc' then f.list_final_price end asc nulls last,
      case when v_sort = 'price_desc' then f.list_final_price end desc nulls last,
      f.pack_id asc
    offset v_offset
    limit v_page_size
  )
  select coalesce(jsonb_agg(o.pack_id), '[]'::jsonb)
    into v_ids
  from ordered o;

  return jsonb_build_object(
    'total', coalesce(v_total, 0),
    'ids', coalesce(v_ids, '[]'::jsonb)
  );
end;
$$;

grant execute on function catalog._round_money(numeric) to anon, authenticated;
grant execute on function catalog._bundle_list_total(catalog.bundles) to anon, authenticated;
grant execute on function catalog._pack_list_final_price(catalog.packs) to anon, authenticated;
grant execute on function catalog.list_public_bundles(int, int, text, text) to anon, authenticated;
grant execute on function catalog.list_public_packs(int, int, text, text) to anon, authenticated;

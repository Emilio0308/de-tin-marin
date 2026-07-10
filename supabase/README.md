# Supabase — De Tin Marín

## Schemas expuestos (API)

Configurar en el dashboard de Supabase → **Settings → API → Exposed schemas**:

`core`, `catalog`, `pricing`, `commerce`, `crm`

## Primer usuario staff (remoto)

1. Crear usuario en **Authentication → Users** (email + password).
2. Copiar el UUID del usuario.
3. En **SQL Editor**:

```sql
insert into core.user_roles (user_id, role)
values ('<uuid-del-usuario>', 'admin');

insert into core.profiles (id, display_name)
values ('<uuid-del-usuario>', 'Admin')
on conflict (id) do nothing;
```

## Migraciones

| Archivo                                     | Contenido                                               |
| ------------------------------------------- | ------------------------------------------------------- |
| `00001_spine_schemas_and_core.sql`          | Schemas + tablas `core.*` con RLS                       |
| `00002_catalog_products_categories.sql`     | `catalog.categories`, `catalog.products`                |
| `00003_api_grants.sql`                      | GRANTs de schema/tablas para `anon`/`authenticated`     |
| `00004_catalog_bundles.sql`                 | `catalog.bundles`, `catalog.bundle_items` + grants      |
| `00005_pricing_campaigns.sql`               | `pricing.campaigns`, `products.campaign_id` + grants    |
| `00006_commerce_orders.sql`                 | `commerce.orders` + grants                              |
| `00007_commerce_payments_shipments.sql`     | `commerce.payments`, `commerce.shipments` + grants      |
| `00008_catalog_products_packages_stock.sql` | S1D — presentaciones, `prices.unit`, stock sealed/loose |
| `00009_surprise_containers_delivery.sql`    | S1E — envases + delivery                                |
| `00010_deduct_stock_for_order.sql`          | S2A — deduct stock al confirmar pago                    |
| `00011_guest_orders_rls.sql`                | S3A — INSERT guest pending_payment                      |
| `00012_get_guest_order.sql`                 | S3A — RPC lookup guest order                            |
| `00013_product_purchase_limits.sql`         | Límites min/max de compra                               |
| `00014_fix_deduct_stock_product_types.sql`  | Deduct unit vs package + presentaciones                 |
| `00015_insert_guest_order.sql`              | RPC insert guest (sin SELECT anon)                      |

> **Importante:** exponer un schema en la API (Settings → API → Exposed schemas)
> no basta. Los roles `anon`/`authenticated` también necesitan `GRANT USAGE` sobre
> el schema y privilegios sobre las tablas. La RLS sigue gobernando las filas.
> Cada nueva migración que cree tablas en un schema propio debe incluir sus grants.

## Deploy remoto

```bash
supabase link --project-ref hmfxknqmqnmtzqviwkad
supabase db push
pnpm gen:db-types
```

## Tests pgTAP

```bash
supabase test db
```

Archivos en `supabase/tests/`.

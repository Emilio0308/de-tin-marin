# S4 · Costo de venta y margen en productos (admin)

|                |                               |
| -------------- | ----------------------------- |
| **Etapa**      | S4 — Reports / catálogo admin |
| **Owner**      | Equipo De Tin Marín           |
| **App(s)**     | `apps/admin`                  |
| **Schemas**    | `catalog`                     |
| **Depende de** | S1A ✅, S1D ✅, S4-01 excel   |
| **Estado**     | done                          |

## Contexto

- Precio de venta de presentación: `prices.normal.netPrice` (DECISIONS #13/#28).
- Costo proveedor es dato de backoffice; no entra a ecommerce ni Orders.
- Margen y % **no se persisten**.

## Objetivo

Staff puede cargar `cost_net_price` en productos; ver margen y % en form/listado; y exportarlos en el Excel de Productos.

## Scope IN

- Columna `catalog.products.cost_net_price` (nullable, `>= 0`) — migración `00019`
- Admin: create/update/list + UI form/list
- `@de-tin-marin/shared/product-margin` — `computeProductMargin`: `margin = sale − cost`; `marginPct = margin / cost` si `cost > 0`
- Excel hoja Productos: Costo, Margen, Margen %
- Regla 26 + DECISIONS #36

## Scope OUT

- **NO** ecommerce / packs / bundles / orders
- **NO** persistir margen/%
- **NO** bloquear venta si costo es null

## Fórmulas

```text
sale = prices.normal.netPrice
margin = sale − cost_net_price
marginPct = margin / cost_net_price   # solo si cost_net_price > 0
```

Si `cost_net_price` es null o 0 → `margin` y `marginPct` = null (UI/Excel "—").

## Criterios de aceptación

- [x] Migración `00019_product_cost_net_price.sql`
- [x] Vitest `packages/shared/src/product-margin.test.ts`
- [x] Form/list admin muestran costo + margen/%
- [x] Excel Productos incluye las 3 columnas
- [x] `pnpm --filter @de-tin-marin/admin typecheck` + build

## Referencias

- [database.md](../../database.md) § products `cost_net_price`
- [pricing.md](../../pricing.md) · [business-rules.md](../../business-rules.md) Regla 26
- [S4/01-catalog-status-excel.md](01-catalog-status-excel.md)

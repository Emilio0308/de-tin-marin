# Reports — módulo admin

Exportaciones operativas del backoffice.

Brief: [S4/01-catalog-status-excel.md](../../../../docs/stages/S4/01-catalog-status-excel.md)

## Capas

```text
actions/ → services/ → (repos de catalog/orders) → Supabase
helpers/ → workbook ExcelJS (puro)
components/catalog-export-panel/ → UI en dashboard
```

## Server Actions

| Action                      | Service                           | Descripción                                      |
| --------------------------- | --------------------------------- | ------------------------------------------------ |
| `exportCatalogStatusAction` | `buildCatalogStatusReportService` | `.xlsx` multi-hoja según `sections` (staff-only) |

Input Zod: `exportCatalogStatusInputSchema` — `sections: ("products" \| "bundles" \| "packs" \| "containers" \| "orders")[]` (min 1).

Output DTO: `{ filename, base64 }` — nunca filas crudas de Supabase.

## Hojas Excel

| Sección    | Hojas                                        |
| ---------- | -------------------------------------------- |
| products   | `Productos` (plana)                          |
| bundles    | `Sorpresas` (bloque entidad + componentes)   |
| packs      | `Packs` (bloque entidad + componentes)       |
| containers | `Envases`                                    |
| orders     | `Ordenes` + `Ordenes_carrito` (hipervínculo) |

Soft-deleted fuera del export de catálogo; órdenes: todas las filas.

## Shared

Disponibilidad pack: `@de-tin-marin/shared/pack-availability` (Regla 22) — mismo motor que ecommerce/checkout.

## UI

Panel en home dashboard (`dashboard-page` + `CatalogExportPanelContainer`). i18n: `messages/es.json` → `Reports` / `Dashboard`.

## Auth

`guardAction` + `requireStaff`.

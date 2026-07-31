# S4 · Export Excel de estado de catálogo (admin)

|                |                                                    |
| -------------- | -------------------------------------------------- |
| **Etapa**      | S4 — Reports ([roadmap.md](../../roadmap.md) § S4) |
| **Owner**      | Equipo De Tin Marín                                |
| **App(s)**     | `apps/admin`                                       |
| **Schemas**    | `catalog`, `pricing`, `commerce` (solo lectura)    |
| **Depende de** | S1A ✅, S1B ✅, S1E ✅, S1F ✅, S1C ✅             |
| **Estado**     | done                                               |

## Contexto (leer esto, no todo docs/)

- Reports = exportaciones operativas; primer slice = estado de catálogo ([architecture.md](../../architecture.md)).
- Productos tienen stock sealed/loose; packs/bundles **no** tienen stock propio (Reglas 5, 22).
- Disponibilidad pack = `min(floor(presentaciones / package_quantity))` sobre componentes activos (Regla 22).
- Tablas: `catalog.products`, `catalog.bundles`, `catalog.bundle_items`, `catalog.packs`, `catalog.pack_items`, `catalog.surprise_containers`, `catalog.categories`, `pricing.campaigns`, `commerce.orders` — ver [database.md](../../database.md).
- Soft-deleted (`deleted_at`) fuera del export de catálogo; activos e inactivos sí. Órdenes: todas las filas de `commerce.orders`.

## Objetivo

Staff en el dashboard admin (:3001) elige secciones (productos, sorpresas, packs, envases, órdenes) y descarga un `.xlsx` multi-hoja con visión completa de estado.

## Scope IN

- Panel checkboxes en home dashboard + Server Action `exportCatalogStatusAction`
- ExcelJS workbook: hojas según selección; sorpresas/packs en bloque entidad+componentes; órdenes en 2 hojas (listado + carrito con hipervínculo)
- `@de-tin-marin/shared` `pack-availability` (Regla 22) reutilizado por admin + ecommerce
- Incluir `isActive`, stock (o disponibilidad derivada), precios, categoría/campaña/BOM; carrito congelado de órdenes

## Scope OUT (traps)

- **NO soft-deleted** → _ruido operativo_
- **NO ventas / métricas órdenes / PDF** → _scope creep S4_
- **NO inventory ledger v2** → _S4 posterior_
- **NO route handler API** — descarga vía action + Blob → _consistencia admin_
- **NO recalcular precios en client** → _discrepancia front/back_
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)                     | ¿Nueva? | Ops    | Política (prosa)  | Test |
| ---------------------------------- | ------- | ------ | ----------------- | ---- |
| `catalog.products`                 | no      | SELECT | Staff (existente) | —    |
| `catalog.bundles` / `bundle_items` | no      | SELECT | Staff (existente) | —    |
| `catalog.packs` / `pack_items`     | no      | SELECT | Staff (existente) | —    |
| `catalog.surprise_containers`      | no      | SELECT | Staff (existente) | —    |
| `catalog.categories`               | no      | SELECT | Staff (existente) | —    |
| `pricing.campaigns`                | no      | SELECT | Staff (existente) | —    |
| `commerce.orders`                  | no      | SELECT | Staff (existente) | —    |

## Boundaries y DTOs

| Boundary                    | Tipo          | Input (Zod)                            | Output DTO (allowlist)                 |
| --------------------------- | ------------- | -------------------------------------- | -------------------------------------- |
| `exportCatalogStatusAction` | Server Action | `{ sections: CatalogSection[] }` min 1 | `{ filename, base64 }` — nunca raw row |

### Hojas / columnas

- **Meta:** generatedAt (ISO), sections, timezone `UTC`
- **Productos:** tabla plana (sku, name, description, slug, brand, categoryName, productType, itemsPerPackage, packageLabel, netPrice, unitNetPrice, finalPrice, finalUnitPrice, campaignName, campaignPercentage, **costNetPrice, margin, marginPct**, stockSealedPackages, stockLooseBaseUnits, stockTotalBaseUnits, stockDisplay, stockInPresentations, purchaseMin/Max, isActive, imageUrl)
- **Sorpresas:** una hoja; **sección por sorpresa** = bloque datos generales (label/valor: name, description, isActive, quantity, containerSku/Name/NetPrice/Stock, itemCount, itemsSubtotal, containerSubtotal, total, imageUrl) + subtítulo `Componentes` + filas de composición (productSku/Name, unitsPerPerson, unitNetPrice, productIsActive, productStockDisplay). Sin hoja `Sorpresas_composicion`.
- **Packs:** una hoja; **sección por pack** = bloque datos generales (sku, name, description, slug, reference/normal/final, campaña, itemCount, availableQuantity, purchaseMin/Max, isActive, imageUrl) + subtítulo `Componentes` + filas (productSku/Name, packageQuantity, packageNetPrice, productPresentations, productIsActive). Sin hoja `Packs_composicion`.
- **Envases:** sku, name, description, netPrice, stockQuantity, isActive, imageUrl
- **Ordenes:** tabla plana de `commerce.orders` (orderNumber, status, paymentStatus, customer, contact, fulfillment, subtotal/discount/shipping/total, lineCount, currency, createdAt) + columna **Ver productos** (hipervínculo a `Ordenes_carrito`)
- **Ordenes_carrito:** sección por orden (ancla) + resumen + líneas del `shopping_cart` congelado (`product` / `pack` / `bundle`) con desglose de componentes y envase

## Rules que aplican

- Invariantes CLAUDE.md: 1, 3, 5, 7, 8, 15
- `docs/rules/00-architecture.md`, `10-auth-and-authorization.md`, `40-validation-and-boundaries.md`, `85-react-components.md`, `88-ui-design-i18n.md`

## Orden de implementación

1. Brief + shared `pack-availability`
2. Módulo `reports` (schema, DTOs, service, workbook, action)
3. Panel UI en dashboard + i18n
4. Tests + `pnpm check` + `pnpm build`

## Criterios de aceptación

- [x] Vitest — `packages/shared/src/pack-availability.test.ts`: 0 items, bottleneck, producto inactivo no cuenta
- [x] Vitest — `apps/admin/src/modules/reports/helpers/build-catalog-status-workbook.test.ts`: hojas pedidas, headers, fila inactiva/stock 0
- [x] Vitest — `apps/admin/src/modules/reports/schemas/export-catalog-status.schema.test.ts`: rechaza `sections: []`
- [x] Vitest — `apps/admin/src/modules/reports/components/catalog-export-panel/catalog-export-panel.test.tsx`: render checkboxes + disabled sin selección
- [x] `pnpm check` (typecheck + lint + format de feature) + `pnpm --filter @de-tin-marin/admin build` verdes
- [ ] Revisado por owner

## Preguntas abiertas

- Ninguna (cerradas en planning).

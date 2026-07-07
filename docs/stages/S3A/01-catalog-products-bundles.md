# S3A-1 · Catálogo público — productos y sorpresas

|                |                                                                |
| -------------- | -------------------------------------------------------------- |
| **Etapa**      | S3A-1 — Catálogo ([roadmap.md](../../roadmap.md) § S3A)        |
| **Owner**      | Equipo De Tin Marín                                            |
| **App(s)**     | `apps/ecommerce`                                               |
| **Schemas**    | `catalog`                                                      |
| **Depende de** | [S3A-0/00-ecommerce-foundation.md](00-ecommerce-foundation.md) |
| **Estado**     | draft                                                          |

## Contexto (leer esto, no todo docs/)

- S3A-0 — módulo `catalog/`, TanStack Query, home sin mocks de catálogo.
- **Regla 3** — solo productos `is_active` y no borrados; inactivos **no se listan**.
- **Regla 4** — stock visible: `stockTotalBaseUnits` derivado de sealed/loose (`formatStockDisplay` en shared).
- **Regla 8 / DECISIONS #6** — precio sorpresa calculado con `computeBundleTotal` (mismo helper que admin `bundle.service`).
- **DECISIONS #18** — `finalPrice` solo backend; v1 sin campañas activas → `finalPrice === unitNetPrice`.
- RLS público: `catalog.products`, `catalog.bundles`, `catalog.bundle_items` ya legibles para activos.

## Objetivo

Un visitante puede navegar **`/productos`** y **`/sorpresas`** con filtros, búsqueda, ordenamiento y paginación por páginas; ve stock y precios reales desde Supabase.

## Scope IN

- Rutas dedicadas:
  - `/productos` — grid/listado paginado
  - `/sorpresas` — grid/listado paginado (plantillas bundle activas)
  - `/productos/[slug]` — detalle producto (opcional v1 mínimo: card expand o página simple)
  - `/sorpresas/[id]` — detalle plantilla → CTA “Personalizar” (enlaza S3A-2)
- Reutilizar/adaptar componentes visuales de `product-catalog`, `bundle-section`, `product-card`, `bundle-card` con **datos reales**
- Server Actions públicas (sin `requireStaff`):
  - `listPublicProducts` — paginación + filtros
  - `listPublicBundles` — paginación + filtros
  - `listPublicCategories` — para filtro categoría (productos)
- **Filtros productos:** categoría (`category_id`), búsqueda `name` / `sku` (ilike), orden: nombre A→Z, Z→A, precio ↑, precio ↓
- **Filtros sorpresas:** búsqueda `name`, orden: nombre A→Z, Z→A, precio ↑, precio ↓ (precio = `computeBundleTotal` en service)
- **Paginación:** offset/limit o `page` + `pageSize` (default 12); UI controles anterior/siguiente + número de página
- DTO allowlist producto: `{ id, sku, slug, name, brand, categoryId, categoryName, imageUrl, finalPrice, stockTotalBaseUnits, stockDisplay, itemsPerPackage }`
- DTO allowlist bundle: `{ id, name, slug?, imageUrl, quantity, containerName, total, itemCount, itemsPreview[] }`
- i18n `messages/es.json` — catálogo, filtros, paginación, estados vacíos
- Nav header: enlaces Productos / Sorpresas
- Vitest — helpers de query params / sort
- Playwright — `apps/ecommerce/e2e/catalog-smoke.spec.ts`: listar productos, filtrar categoría, buscar SKU

## Scope OUT (traps)

- **NO wizard personalización** → S3A-2
- **NO carrito** → S3A-3
- **NO badge campaña / precio tachado** → S1C operativo futuro
- **NO mostrar productos inactivos** — filtro server-side obligatorio
- **NO ordenar por stock** — fuera v1
- **NO infinite scroll** — solo paginación por páginas
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)                | ¿Nueva? | Ops    | Política                        | Test      |
| ----------------------------- | ------- | ------ | ------------------------------- | --------- |
| `catalog.products`            | —       | SELECT | Público activos no borrados     | existente |
| `catalog.categories`          | —       | SELECT | Público activos                 | existente |
| `catalog.bundles`             | —       | SELECT | Público activos no borrados     | existente |
| `catalog.bundle_items`        | —       | SELECT | Público (join bundle activo)    | existente |
| `catalog.surprise_containers` | —       | SELECT | Público activos (precio envase) | existente |

Sin migración si queries actuales + RLS bastan. Si paginación en SQL compleja → vista/RPC opcional en brief de implementación (documentar en PR).

## Boundaries y DTOs

| Boundary             | Tipo          | Input (Zod)                    | Output DTO                                |
| -------------------- | ------------- | ------------------------------ | ----------------------------------------- |
| `listPublicProducts` | Server Action | `publicProductListQuerySchema` | `{ items, page, pageSize, total }`        |
| `listPublicBundles`  | Server Action | `publicBundleListQuerySchema`  | `{ items, page, pageSize, total }`        |
| `getPublicProduct`   | Server Action | `{ slug }` o `{ id }`          | `PublicProductDetailDTO`                  |
| `getPublicBundle`    | Server Action | `{ id }`                       | `PublicBundleDetailDTO` + items plantilla |

`publicProductListQuerySchema`:

```typescript
{
  page?: number;           // default 1
  pageSize?: number;       // default 12, max 48
  categoryId?: string;     // uuid
  search?: string;         // name or sku
  sort?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
}
```

## Rules que aplican

- Reglas **3, 4, 8, 9** (finalPrice backend)
- DECISIONS **#6, #18, #23**
- [`rules/88-ui-design-i18n.md`](../../rules/88-ui-design-i18n.md) — **prohibido** `home.data.ts` en rutas de catálogo

## Orden de implementación

1. Validations Zod query + DTOs públicos
2. Repository/service ecommerce (o reutilizar repos con config anon)
3. Actions + TanStack Query hooks
4. Páginas `/productos`, `/sorpresas` + componentes
5. Detalle mínimo + link a wizard
6. i18n + tests + Playwright
7. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] `/productos` muestra solo productos activos con `finalPrice` y stock display
- [ ] Filtro categoría + búsqueda por SKU funcionan
- [ ] Orden precio/nombre coincide con helper backend (misma fuente que admin)
- [ ] `/sorpresas` muestra total calculado = admin listado para misma plantilla
- [ ] Paginación: página 2 no repite ítems de página 1
- [ ] Producto inactivo no aparece en ningún listado público
- [ ] Vitest — `public-catalog*.test.ts` query/sort
- [ ] Playwright — `catalog-smoke.spec.ts` happy path
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- **Slug en bundles:** si no existe columna `slug` en `bundles`, usar `id` en URL v1 — cerrar en implementación.

## Depends on

- [00-ecommerce-foundation.md](00-ecommerce-foundation.md)
- [database.md](../../database.md) § products, bundles

## Bloquea

- S3A-2 (detalle bundle + listado productos para picker)

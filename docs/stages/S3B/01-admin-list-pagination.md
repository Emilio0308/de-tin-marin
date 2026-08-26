# S3B · Paginación SQL de listados admin

|                |                                                    |
| -------------- | -------------------------------------------------- |
| **Etapa**      | S3B — Admin ([roadmap.md](../../roadmap.md) § S3B) |
| **Owner**      | Equipo De Tin Marín                                |
| **App(s)**     | `apps/admin`                                       |
| **Schemas**    | `catalog`, `commerce` (solo lectura en listados)   |
| **Depende de** | S1A ✅, S1B ✅, S1E ✅, S1F ✅, S2B ✅             |
| **Estado**     | done                                               |

## Contexto

- Listados admin cargaban el catálogo completo en cliente; a escala es costoso.
- Ecommerce ya remediado en S3A-1-R (`00021` + PostgREST count/range).
- Filtros y página deben vivir en `searchParams` (compartibles / back-forward).

## Objetivo

Staff navega listados admin con **paginación SQL real** (`count: exact` + `.range()`), búsqueda y filtro de estado vía URL.

## Scope IN

- `@de-tin-marin/validations/admin-list` — schemas `page`/`pageSize` (**default 5**, max 50) + filtros por entidad
- `*PageRepo` / `*PageService` / `*PageAction` para: categories, products, bundles, packs, containers, orders
- Prefetch SSR + `HydrationBoundary` en `app/(dashboard)/…/page.tsx` (`createAdminQueryClient`)
- Forms/composición: **no** listado completo — `ProductSearchPicker` + `listProductsPageAction` (S4+)
- UI: `AdminTablePagination` + `admin-list-url` helpers; query keys incluyen filtros
- i18n labels de paginación

## Scope OUT

- **NO** RPCs nuevas (PostgREST basta en admin staff)
- **NO** sort configurable por columna (orden fijo por entidad)
- **NO** cambiar ecommerce (ya S3A-1-R)
- **NO** infinite scroll en tablas (el picker de productos sí: scroll infinito + sentinel; no botón “cargar más”)

## Boundaries

| Boundary          | Input                | Output                                           |
| ----------------- | -------------------- | ------------------------------------------------ |
| `list*PageAction` | Zod admin-list query | `{ items, page, pageSize, total }` DTO allowlist |

> **Post-S4:** `listProductsAction` (catálogo completo) se eliminó del boundary de UI; usar `listProductsPageAction`. `listProductsService`/`listProductsRepo` pueden quedar para usos internos puntuales.

## Criterios

- [x] Vitest `packages/validations/src/admin-list.test.ts`
- [x] Vitest `admin-table-pagination.test.tsx`
- [x] Listados `/products`, `/categories`, `/bundles`, `/packs`, `/containers`, `/orders` paginan en SQL
- [x] README catalog/orders actualizados
- [x] SSR + hidratación RQ en listados admin; home ecommerce vía `loadStorefrontCatalog`

## Referencias

- [50-data-fetching-cache-ssr.md](../../rules/50-data-fetching-cache-ssr.md)
- READMEs: `apps/admin/src/modules/catalog/README.md`, `orders/README.md`

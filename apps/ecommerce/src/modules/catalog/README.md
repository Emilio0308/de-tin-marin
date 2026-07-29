# Módulo `catalog`

Catálogo público de productos, sorpresas y combos (S3A-1 / S3A-05).

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Estructura

- `repositories/` — lectura Supabase (anon + RLS público)
- `services/public-catalog.service.ts` — DTOs, precios, paginación en memoria
- `services/catalog-version.service.ts` — `catalog_cache_meta.version_at`
- `actions/` — Server Actions sin `requireStaff`
- `components/` — páginas de detalle

## Actions

| Action                       | Descripción                                    |
| ---------------------------- | ---------------------------------------------- |
| `listPublicProductsAction`   | Productos activos con filtros y paginación     |
| `listPublicBundlesAction`    | Bundles activos con total `computeBundleTotal` |
| `listPublicPacksAction`      | Combos activos con `finalPrice`                |
| `listPublicCategoriesAction` | Categorías para filtro                         |
| `getPublicProductAction`     | Detalle por `slug` o `id`                      |
| `getPublicBundleAction`      | Detalle por `id`                               |
| `getPublicPackAction`        | Detalle combo por `slug`                       |
| `getCatalogVersionAction`    | Timestamp de versión de catálogo               |
| `getCartLineMetaAction`      | Batch productos/packs para meta del carrito    |

## Caché y `catalog_version`

- Listados home: React Query con `catalogQueryOptions` (`staleTime: Infinity`).
- Gate: `useCatalogVersionGate` — seed inicial + **Realtime Broadcast** (`catalog-version` / `catalog_version_changed`); sin poll.
- Al recibir el evento (o versión distinta al volver a la pestaña) → `invalidateQueries` de listados (`refetchType: 'all'`).
- Admin: `catalog.bump_catalog_version()` hace bump + `realtime.send` (público).

## Rutas y estrategia de datos

| Ruta                                  | SSR                                          | Cliente                                    | Caché           |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------ | --------------- |
| `/` — tabs productos/sorpresas/combos | Objetivo (#32)                               | `storefront-page.container` + RQ + versión | Infinity + gate |
| `/productos/[slug]`                   | Sí — `getPublicProductAction` en `page.tsx`  | Props al container                         | Sin RQ en mount |
| `/sorpresas/[id]`                     | Sí — `getPublicBundleAction`                 | Props al container                         | Sin RQ en mount |
| `/combos/[slug]`                      | Sí — `getPublicPackAction`                   | Props al container                         | Sin RQ en mount |
| `/sorpresas/[id]/personalizar`        | Sí — template vía `getBundleForWizardAction` | Picker + preview en wizard container       | Preview: fresco |

Filtros del home (categoría, búsqueda, sort, página) viven en `searchParams`; la query key incluye el query completo.

## Paginación

Productos, sorpresas y combos: el repo trae todos los registros que matchean el filtro; el service ordena en memoria y corta con `paginateItems`. Aceptado en v1; migrar a SQL si el catálogo crece.

## Query keys (ecommerce)

`@/shared/query/query-keys.ts` → `queryKeys.catalog.*` (incluye `version()`)

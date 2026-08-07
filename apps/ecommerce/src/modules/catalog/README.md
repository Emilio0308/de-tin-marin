# Módulo `catalog`

Catálogo público de productos, sorpresas y combos (S3A-1 / S3A-05).

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Estructura

- `repositories/` — lectura Supabase (anon + RLS público)
- `services/public-catalog.service.ts` — DTOs, precios; packs usan `@de-tin-marin/shared/pack-availability` (Regla 22; BOM dual `packageQuantity` + `unitQuantity`, S4-04)
- `services/catalog-version.service.ts` — `catalog_cache_meta.version_at`
- Home SSR: `apps/ecommerce/src/modules/home/services/load-storefront-catalog.ts` (tab activo + hero + versión)
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

- Listados home: **SSR** vía `loadStorefrontCatalog` + `HydrationBoundary`; cliente usa `catalogQueryOptions` (`staleTime: Infinity`) sin refetch en mount.
- Gate: `useCatalogVersionGate` — seed SSR + **Realtime Broadcast** (`catalog-version` / `catalog_version_changed`); sin poll.
- Al recibir el evento (o versión distinta al volver a la pestaña) → `invalidateQueries` de listados (`refetchType: 'all'`).
- Admin: `catalog.bump_catalog_version()` hace bump + `realtime.send` (público).

## Rutas y estrategia de datos

| Ruta                                  | SSR                                                         | Cliente                                                        | Caché           |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- | --------------- |
| `/` — tabs productos/sorpresas/combos | Sí — `loadStorefrontCatalog` + `HydrationBoundary`          | `storefront-page.container` + RQ + versión (sin refetch mount) | Infinity + gate |
| `/productos/[slug]`                   | Sí — `getPublicProductAction` + sugerencias misma categoría | Props al container (sin costo/margen)                          | Sin RQ en mount |
| `/sorpresas/[id]`                     | Sí — `getPublicBundleAction`                                | Props al container                                             | Sin RQ en mount |
| `/combos/[slug]`                      | Sí — `getPublicPackAction`                                  | Props al container                                             | Sin RQ en mount |
| `/sorpresas/[id]/personalizar`        | Sí — template vía `getBundleForWizardAction`                | Picker + preview en wizard container                           | Preview: fresco |

Filtros del home (categoría, búsqueda, sort, página) viven en `searchParams`; la query key incluye el query completo.

## Paginación

- **Productos:** PostgREST `count: 'exact'` + `ORDER BY` + `.range()` en `listPublicProductsRepo`. Sort `name_*` por columna; `price_*` por `prices->normal->netPrice` (sin campañas en listado, alineado al DTO actual).
- **Sorpresas:** RPC `catalog.list_public_bundles` (COUNT + orden por nombre/`list_total` + LIMIT/OFFSET). El service solo carga items/containers de la página.
- **Combos:** RPC `catalog.list_public_packs` (orden por nombre/`finalPrice` con campaña activa). Items/campañas solo de la página.

`total` viene del count SQL / RPC, no de `array.length` en memoria. Remediación S3A-1-R.

## Query keys (ecommerce)

`@/shared/query/query-keys.ts` → `queryKeys.catalog.*` (incluye `version()`)

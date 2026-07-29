# Módulo `catalog`

Catálogo público de productos y sorpresas (S3A-1).

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Estructura

- `repositories/` — lectura Supabase (anon + RLS público)
- `services/public-catalog.service.ts` — DTOs, precios, paginación en memoria
- `actions/` — Server Actions sin `requireStaff`
- `components/` — páginas de detalle

## Actions

| Action                       | Descripción                                    |
| ---------------------------- | ---------------------------------------------- |
| `listPublicProductsAction`   | Productos activos con filtros y paginación     |
| `listPublicBundlesAction`    | Bundles activos con total `computeBundleTotal` |
| `listPublicCategoriesAction` | Categorías para filtro                         |
| `getPublicProductAction`     | Detalle por `slug` o `id`                      |
| `getPublicBundleAction`      | Detalle por `id`                               |

## Rutas y estrategia de datos

| Ruta                                       | SSR                                          | Cliente                                       | Caché           |
| ------------------------------------------ | -------------------------------------------- | --------------------------------------------- | --------------- |
| `/` — tab productos (categorías + listado) | Objetivo (#32)                               | Hoy: `storefront-page.container` + `useQuery` | RQ 15 min       |
| `/` — tab sorpresas                        | Objetivo (#32)                               | Hoy: `useQuery` `bundlesList`                 | RQ 15 min       |
| `/productos/[slug]`                        | Sí — `getPublicProductAction` en `page.tsx`  | Props al container                            | Sin RQ en mount |
| `/sorpresas/[id]`                          | Sí — `getPublicBundleAction`                 | Props al container                            | Sin RQ en mount |
| `/sorpresas/[id]/personalizar`             | Sí — template vía `getBundleForWizardAction` | Picker + preview en wizard container          | Preview: fresco |

Filtros del home (categoría, búsqueda, sort, página) viven en `searchParams`; la query key incluye el query completo.

## Paginación

Productos y sorpresas: el repo trae todos los registros que matchean el filtro; el service ordena en memoria y corta con `paginateItems`. Aceptado en v1; migrar a SQL si el catálogo crece.

## Query keys (ecommerce)

`@/shared/query/query-keys.ts` → `queryKeys.catalog.*`

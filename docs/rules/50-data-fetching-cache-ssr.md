# 50 — Data fetching, SSR y caché

> **Alcance:** Cuándo usar SSR vs CSR, React Query, `staleTime`/`gcTime`, query keys y política de Next.js Data Cache.
> **Decisión:** [`DECISIONS.md`](../DECISIONS.md) #32.
> **Aplica a:** `apps/ecommerce` y `apps/admin`.

## Principio

**SSR en navegación/catálogo** (datos que no cambian segundo a segundo). **Funnel de compra** valida precios/stock en el momento (carrito sync al montar; checkout estricto al submit).

```text
Navegación / catálogo     → SSR donde sea viable + caché cliente larga + catalog_version
Funnel — carrito          → CSR + RQ fresco al montar (sin polling 30 s)
Funnel — checkout         → Validación estricta al submit; fee fresco
Preview dinámico          → CSR + React Query con staleTime: 0 + debounce en UI
```

## Capas (sin cambios)

```text
UI (page / container)
  → Server Action ("use server")
    → Service
      → Repository → Supabase
```

Las Server Actions invocadas desde el cliente **no** pasan por Next.js Data Cache: cada llamada es un POST dinámico al servidor.

## Cuándo SSR vs CSR

| Tipo de pantalla                                 | Estrategia                 | Motivo                                                                                    |
| ------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------- |
| Home — categorías, productos, sorpresas          | **SSR** + hidratación RQ   | First paint, SEO; frescura vía `catalog_version`                                          |
| Detalle producto `/productos/[slug]`             | **SSR**                    | Ya implementado: `page.tsx` → props al container                                          |
| Detalle sorpresa `/sorpresas/[id]`               | **SSR**                    | Ya implementado                                                                           |
| Wizard — template `/sorpresas/[id]/personalizar` | **SSR**                    | Plantilla en servidor; picker y preview en cliente                                        |
| Wizard — picker / preview                        | **CSR + RQ**               | Interacción; preview con precio/stock al momento                                          |
| Carrito `/carrito`                               | **CSR + RQ fresco**        | Sync precios/límites/stock al montar; rebuild tras checkout drift                         |
| Checkout `/checkout`                             | **CSR + validate**         | Fee fresco; validación precio/stock al submit                                             |
| Admin — listados CRUD                            | **SSR** + RQ (hidratación) | URL `page`/`pageSize`/filtros; SQL `count`+`range`; caché 15 min; invalidar tras mutación |
| Admin — order-form preview                       | **CSR + RQ fresco**        | Mismo motor que `createOrderService`                                                      |

### Estado actual vs objetivo

| Ruta                      | Hoy                          | Objetivo (#32) |
| ------------------------- | ---------------------------- | -------------- |
| `/` (home listados)       | SSR + HydrationBoundary + RQ | Mantener       |
| Detalle producto/sorpresa | SSR                          | Mantener       |
| Wizard template           | SSR                          | Mantener       |

**Regla:** si `page.tsx` ya resolvió el DTO en SSR, el container **no** vuelve a pedir el mismo recurso con `useQuery` en mount.

## `catalog_version` (timestamp)

Tabla singleton `catalog.catalog_cache_meta.version_at`.

| Quién      | Qué                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Admin      | Tras mutación de catálogo (y deduct stock al `paid`) llama `catalog.bump_catalog_version()`                                                                                                      |
| Ecommerce  | Seed `getCatalogVersionAction` + **Realtime Broadcast** público `catalog-version` / `catalog_version_changed` (sin poll). Safety: 1 check al `visibilitychange`. Si cambia → invalidate listados |
| Admin / DB | `catalog.bump_catalog_version()` → `version_at = now()` + `realtime.send(...)`                                                                                                                   |

La frescura del listado la gobierna la versión, no un TTL corto.

## React Query — configuración

Constantes en `apps/<app>/src/shared/query/query-cache.ts`:

| Constante                | Valor                                 | Uso                                        |
| ------------------------ | ------------------------------------- | ------------------------------------------ |
| `CATALOG_QUERY_CACHE_MS` | ecommerce **24 h** / admin **15 min** | Default `QueryProvider`; `gcTime` listados |
| `catalogQueryOptions`    | `staleTime: Infinity`, `gcTime: 24 h` | Listados ecommerce (gate por versión)      |
| `freshQueryOptions`      | `staleTime: 0`, `gcTime: 0`           | Carrito sync, fee checkout, preview        |

### Defaults del `QueryProvider` (ecommerce)

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CATALOG_QUERY_CACHE_MS, // 24 h
      gcTime: CATALOG_QUERY_CACHE_MS,
    },
  },
});
// + <CatalogVersionGate /> monta useCatalogVersionGate
```

Listados de catálogo usan `...catalogQueryOptions`. La query de versión (`queryKeys.catalog.version()`):

- Seed: `staleTime: Infinity` (sin poll).
- Realtime Broadcast en topic `catalog-version` / event `catalog_version_changed`.
- Safety: al `visibilitychange` → `invalidateQueries(version)` una vez (si el WS falló).

### Overrides por tier

| Tier                         | `staleTime`                   | Queries ejemplo                                |
| ---------------------------- | ----------------------------- | ---------------------------------------------- |
| Catálogo / navegación        | Infinity (+ gate versión)     | `queryKeys.catalog.*` (listados)               |
| Funnel de compra             | **0** (`freshQueryOptions`)   | cart metadata, cart pricing sync, delivery fee |
| Preview precio               | **0** + debounce 300 ms en UI | wizard preview, admin bundle/cart preview      |
| Checkout validate            | al submit (action, no poll)   | `validateGuestCheckoutCart`                    |
| Zonas de delivery (checkout) | 15 min / default              | Cambian poco; fee sigue fresco                 |

Admin: `invalidateAdminCatalogLists` solo invalida listas de catálogo indicadas (`products`, `categories`, `bundles`, `surpriseContainers`, `packs`) — **nunca** órdenes ni otros dominios. Tras mutación también `bumpCatalogVersionSafe` → RPC `bump_catalog_version` (Broadcast a tienda).

Listados admin paginados: `page` / `pageSize` / filtros en `searchParams` (`admin-list-url`); default **`ADMIN_DEFAULT_PAGE_SIZE = 5`** (max 50) en `@de-tin-marin/validations/admin-list`. Prefetch SSR en `page.tsx` + `createAdminQueryClient` + `HydrationBoundary`; actions `list*PageAction`. Brief: [`S3B/01-admin-list-pagination.md`](../stages/S3B/01-admin-list-pagination.md).

**Home ecommerce:** `loadStorefrontCatalog` (solo tab activo + hero + `catalog_version`) → seed RQ en `app/page.tsx`.

**Admin composición / order-form:** no cargar catálogo completo — `ProductSearchPicker` + `listProductsPageAction` (debounce 300 ms; `pageSize = ADMIN_DEFAULT_PAGE_SIZE`; scroll infinito vía `IntersectionObserver`; auto-avanza página si `excludeIds` deja la vista vacía).

**Dashboard admin:** `getDashboardSummaryService` (counts SQL + recent orders + low-stock candidates) — no `listProducts` / `listOrders` completos.

## Query keys

**Obligatorio:** definir keys en `apps/<app>/src/shared/query/query-keys.ts`. Prohibido inventar arrays inline salvo prototipos que se migran antes del merge.

La key debe incluir **todos** los parámetros que afecten el resultado (filtros URL, `search`, componentes de bundle, líneas del carrito, etc.).

Convenciones ecommerce:

| Dominio  | Prefijo              | Ejemplo                                      |
| -------- | -------------------- | -------------------------------------------- |
| Catálogo | `queryKeys.catalog`  | `version()`, `productsList(productQuery)`    |
| Wizard   | `queryKeys.wizard`   | `preview(bundleId, components)`              |
| Carrito  | `queryKeys.cart`     | `productMeta(cartLineIds)`, `pricing(lines)` |
| Checkout | `queryKeys.checkout` | `deliveryFee(district, mapPin)`              |

## SSR en `page.tsx`

| Regla               | Detalle                                   |
| ------------------- | ----------------------------------------- |
| Page delgada        | Fetch + `notFound()` + labels i18n        |
| Props serializables | DTOs de `@de-tin-marin/validations`       |
| Errores             | `NOT_FOUND` → `notFound()`; resto → throw |
| Sin hooks           | Las pages async no usan `useQuery`        |

## Next.js Data Cache

| Regla            | Detalle                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| Por defecto      | **No usar** `unstable_cache`, `fetch` cacheado ni `revalidate` en catálogo/checkout |
| Motivo           | Precios y stock cambian; el backend ya calcula `finalPrice` (#18)                   |
| Excepción futura | Solo con TTL documentado + `revalidateTag` al mutar en admin                        |

## Container / presentational

Ver [`85-react-components.md`](85-react-components.md):

- **Container:** `useQuery` / `useInfiniteQuery`, `enabled`, spread de `freshQueryOptions` / `catalogQueryOptions` cuando aplique.
- **Presentational:** recibe `isLoading`, `isError`, `onRetry`; sin TanStack Query.

## Anti-patrones (prohibidos)

- `useQuery` en container para el mismo DTO que ya vino por SSR en la misma ruta
- `staleTime: Infinity` en precios/stock del funnel sin gate de versión o validate
- Query keys inline permanentes fuera de `query-keys.ts`
- Importar repositories o módulos `server-only` desde `'use client'`
- `unstable_cache` sin plan de invalidación al editar en admin
- Recalcular `finalPrice` en el cliente (viola #18)
- Polling continuo de stock/pricing en checkout (validar al submit)

## Módulos de referencia

| Módulo             | README                                         | Patrón                             |
| ------------------ | ---------------------------------------------- | ---------------------------------- |
| Catálogo ecommerce | `apps/ecommerce/src/modules/catalog/README.md` | Versión + RQ largo; detalle SSR    |
| Carrito            | `apps/ecommerce/src/modules/cart/README.md`    | Sync al montar; rebuild tras drift |
| Checkout           | `apps/ecommerce/src/modules/checkout/`         | Validate al submit                 |
| Órdenes admin      | `apps/admin/src/modules/orders/README.md`      | RQ + preview fresco                |

## Enforcement

| Regla                  | Cómo                                           |
| ---------------------- | ---------------------------------------------- |
| Versión + caché larga  | `catalog_cache_meta` + `useCatalogVersionGate` |
| Fresco en funnel       | `freshQueryOptions` / validate al submit       |
| Keys centralizadas     | Review + convención                            |
| No Data Cache catálogo | Review                                         |

Ver también [`00-architecture.md`](00-architecture.md) · [`85-react-components.md`](85-react-components.md).

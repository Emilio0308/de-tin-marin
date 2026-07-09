# 50 — Data fetching, SSR y caché

> **Alcance:** Cuándo usar SSR vs CSR, React Query, `staleTime`/`gcTime`, query keys y política de Next.js Data Cache.
> **Decisión:** [`DECISIONS.md`](../DECISIONS.md) #32.
> **Aplica a:** `apps/ecommerce` y `apps/admin`.

## Principio

**SSR en navegación/catálogo** (datos que no cambian segundo a segundo). **Datos frescos en el funnel de compra** (carrito, checkout, preview de precio/stock) para evitar discrepancias de precio al pagar.

```text
Navegación / catálogo     → SSR donde sea viable + caché cliente 15 min
Funnel de compra          → CSR + React Query con staleTime: 0
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

| Tipo de pantalla                                 | Estrategia          | Motivo                                                            |
| ------------------------------------------------ | ------------------- | ----------------------------------------------------------------- |
| Home — categorías, productos, sorpresas          | **SSR** (objetivo)  | First paint, SEO; datos de catálogo estables en ventana de 15 min |
| Detalle producto `/productos/[slug]`             | **SSR**             | Ya implementado: `page.tsx` → props al container                  |
| Detalle sorpresa `/sorpresas/[id]`               | **SSR**             | Ya implementado                                                   |
| Wizard — template `/sorpresas/[id]/personalizar` | **SSR**             | Plantilla en servidor; picker y preview en cliente                |
| Wizard — picker / preview                        | **CSR + RQ**        | Interacción; preview con precio/stock al momento                  |
| Carrito `/carrito`                               | **CSR + RQ fresco** | Precios, límites y stock actuales                                 |
| Checkout `/checkout`                             | **CSR + RQ fresco** | Fee, stock y totales al confirmar                                 |
| Admin — listados CRUD                            | **CSR + RQ**        | Caché 15 min; invalidar tras mutación                             |
| Admin — order-form preview                       | **CSR + RQ fresco** | Mismo motor que `createOrderService`                              |

### Estado actual vs objetivo

| Ruta                      | Hoy      | Objetivo (#32)                        |
| ------------------------- | -------- | ------------------------------------- |
| `/` (home listados)       | CSR + RQ | SSR + hidratación (deuda documentada) |
| Detalle producto/sorpresa | SSR      | Mantener                              |
| Wizard template           | SSR      | Mantener                              |

**Regla:** si `page.tsx` ya resolvió el DTO en SSR, el container **no** vuelve a pedir el mismo recurso con `useQuery` en mount.

## React Query — configuración

Constantes en `apps/<app>/src/shared/query/query-cache.ts`:

| Constante                | Valor                       | Uso                                     |
| ------------------------ | --------------------------- | --------------------------------------- |
| `CATALOG_QUERY_CACHE_MS` | **15 min** (900_000 ms)     | Default en `QueryClient`                |
| `freshQueryOptions`      | `staleTime: 0`, `gcTime: 0` | Carrito, checkout, preview precio/stock |

### Defaults del `QueryProvider`

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CATALOG_QUERY_CACHE_MS,
      gcTime: CATALOG_QUERY_CACHE_MS,
    },
  },
});
```

### Overrides por tier

| Tier                           | `staleTime`                          | Queries ejemplo                                   |
| ------------------------------ | ------------------------------------ | ------------------------------------------------- |
| Catálogo / navegación          | 15 min (default)                     | `queryKeys.catalog.*`, wizard product search      |
| Funnel de compra               | **0** (`freshQueryOptions`)          | cart metadata, checkout stock, delivery fee       |
| Preview precio                 | **0** + debounce 300 ms en UI        | wizard preview, admin bundle/cart preview         |
| Carrito / checkout (ecommerce) | **0** + refetch cada 30 s y al focus | `previewGuestOrderCartAction` + sync localStorage |

Admin: `invalidateAdminCatalogLists` solo invalida listas de catálogo indicadas (`products`, `categories`, `bundles`, `surpriseContainers`) — **nunca** órdenes ni otros dominios.
| Zonas de delivery (checkout) | 15 min (default) | Cambian poco; fee y stock siguen frescos |

## Query keys

**Obligatorio:** definir keys en `apps/<app>/src/shared/query/query-keys.ts`. Prohibido inventar arrays inline salvo prototipos que se migran antes del merge.

La key debe incluir **todos** los parámetros que afecten el resultado (filtros URL, `search`, componentes de bundle, líneas del carrito, etc.).

Convenciones ecommerce:

| Dominio  | Prefijo              | Ejemplo                                         |
| -------- | -------------------- | ----------------------------------------------- |
| Catálogo | `queryKeys.catalog`  | `productsList(productQuery)`                    |
| Wizard   | `queryKeys.wizard`   | `preview(bundleId, components)`                 |
| Carrito  | `queryKeys.cart`     | `productMeta(cartLineIds)`                      |
| Checkout | `queryKeys.checkout` | `stock(lines)`, `deliveryFee(district, mapPin)` |

Admin order-form: migrar keys inline (`admin-order`, …) a `queryKeys` en iteración posterior.

Tras **mutaciones** en formularios o listados admin, llamar `invalidateAdminCatalogLists(queryClient, …)` con `refetchType: 'all'` para que el listado se actualice aunque `staleTime` sea 15 min.

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

- **Container:** `useQuery` / `useInfiniteQuery`, `enabled`, spread de `freshQueryOptions` cuando aplique.
- **Presentational:** recibe `isLoading`, `isError`, `onRetry`; sin TanStack Query.

## Anti-patrones (prohibidos)

- `useQuery` en container para el mismo DTO que ya vino por SSR en la misma ruta
- `staleTime: Infinity` en precios, stock o preview de orden
- Query keys inline permanentes fuera de `query-keys.ts`
- Importar repositories o módulos `server-only` desde `'use client'`
- `unstable_cache` sin plan de invalidación al editar en admin
- Recalcular `finalPrice` en el cliente (viola #18)

## Módulos de referencia

| Módulo             | README                                         | Patrón                                   |
| ------------------ | ---------------------------------------------- | ---------------------------------------- |
| Catálogo ecommerce | `apps/ecommerce/src/modules/catalog/README.md` | SSR detalle; listado home → SSR objetivo |
| Carrito            | `apps/ecommerce/src/modules/cart/README.md`    | RQ fresco                                |
| Checkout           | `apps/ecommerce/src/modules/checkout/`         | RQ fresco en stock/fee                   |
| Órdenes admin      | `apps/admin/src/modules/orders/README.md`      | RQ + preview fresco                      |

## Enforcement

| Regla                  | Cómo                                                       |
| ---------------------- | ---------------------------------------------------------- |
| Defaults 15 min        | `query-provider.tsx` + `query-cache.ts`                    |
| Fresco en checkout     | `freshQueryOptions` en containers de cart/checkout/preview |
| Keys centralizadas     | Review + convención                                        |
| No Data Cache catálogo | Review                                                     |

Ver también [`00-architecture.md`](00-architecture.md) · [`85-react-components.md`](85-react-components.md).

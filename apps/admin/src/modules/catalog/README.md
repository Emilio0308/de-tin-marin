# Catálogo — módulo admin

CRUD de categorías, productos, sorpresas (bundles) y **combos (packs)** en `apps/admin`.

Briefs: [S1A](../../../docs/stages/S1A/01-catalog-products-categories.md) · [S1B](../../../docs/stages/S1B/01-bundles.md) · [S1D](../../../docs/stages/S1D/01-products-packages-stock.md) · [S1F](../../../docs/stages/S1F/01-catalog-packs.md) · [S4/02](../../../docs/stages/S4/02-product-cost-margin.md) _(costo/margen)_ · [S4/04](../../../docs/stages/S4/04-pack-dual-quantities.md) _(BOM pack dual)_

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema catalog
```

## Server Actions (`actions/`)

| Action                             | Service                             | Descripción                                                                     |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `listCategoriesAction`             | `listCategoriesService`             | Listado completo (selects/forms)                                                |
| `listCategoriesPageAction`         | `listCategoriesPageService`         | Listado paginado (SQL `count` + `range`)                                        |
| `getCategoryAction`                | `getCategoryService`                | Detalle por id                                                                  |
| `createCategoryAction`             | `createCategoryService`             | Crear                                                                           |
| `updateCategoryAction`             | `updateCategoryService`             | Editar                                                                          |
| `softDeleteCategoryAction`         | `softDeleteCategoryService`         | Soft-delete                                                                     |
| `listProductsPageAction`           | `listProductsPageService`           | Listado paginado (`search`/`categoryId`/`status`)                               |
| `getProductAction`                 | `getProductService`                 | Detalle por id                                                                  |
| `createProductAction`              | `createProductService`              | Crear (+ `costNetPrice` opcional)                                               |
| `updateProductAction`              | `updateProductService`              | Editar                                                                          |
| `softDeleteProductAction`          | `softDeleteProductService`          | Soft-delete                                                                     |
| `listBundlesAction`                | `listBundlesService`                | Listado completo + total calculado                                              |
| `listBundlesPageAction`            | `listBundlesPageService`            | Listado paginado (`search`/`status`)                                            |
| `getBundleAction`                  | `getBundleService`                  | Detalle + items (`BundleFormItemDTO` con sku/imagen/stock/`isActive`)           |
| `createBundleAction`               | `createBundleService`               | Crear                                                                           |
| `updateBundleAction`               | `updateBundleService`               | Editar                                                                          |
| `softDeleteBundleAction`           | `softDeleteBundleService`           | Soft-delete                                                                     |
| `listPacksAction`                  | `listPacksService`                  | Listado completo combos + `finalPrice` + `availableQuantity` / `stockShortages` |
| `listPacksPageAction`              | `listPacksPageService`              | Listado paginado (`search`/`status`) + disponibilidad                           |
| `getPackAction`                    | `getPackService`                    | Detalle + items + reference/normal                                              |
| `createPackAction`                 | `createPackService`                 | Crear (`normal >= reference`)                                                   |
| `updatePackAction`                 | `updatePackService`                 | Editar                                                                          |
| `softDeletePackAction`             | `softDeletePackService`             | Soft-delete                                                                     |
| `listSurpriseContainersAction`     | `listSurpriseContainersService`     | Listado completo envases (selects)                                              |
| `listSurpriseContainersPageAction` | `listSurpriseContainersPageService` | Listado paginado (`search`/`status` incl. `outOfStock`)                         |
| `listActiveCampaignsAction`        | —                                   | Campañas activas para select de pack                                            |

Listados admin (`/categories`, `/products`, `/bundles`, `/packs`, `/containers`, `/orders`): **SSR + `HydrationBoundary`** + paginación SQL (`count: "exact"` + `.range()`) vía `*PageRepo` → `*PageService` → prefetch en `page.tsx`. Filtros en `searchParams` (`@de-tin-marin/validations/admin-list`).

**Pack/bundle forms (composición):** `ProductSearchPicker` + `listProductsPageAction` (búsqueda paginada). Feature flag `SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH` (`lib/include-inactive-products-switch.ts`, hoy `false`). Create/update validan solo productos activos (Regla 6 / `getActiveProductsByIdsRepo`). Al editar, `mergeBundleProductOptions` / `mergePackProductOptions` conservan ítems ya en la composición.

Imágenes de catálogo: `createCatalogImageUploadUrlAction` — preview local; PUT S3 al Guardar (DECISIONS #35).

| Form                       | Folder S3    |
| -------------------------- | ------------ |
| Combos (`pack-form`)       | `packs`      |
| Productos (`product-form`) | `products`   |
| Sorpresas (`bundle-form`)  | `bundles`    |
| Envases (`container-form`) | `containers` |

Ver [S0-03](../../../docs/stages/S0/03-admin-pack-image-upload.md) · [infra.md](../../../docs/infra.md).

## Services (`services/`)

- `category.service.ts`
- `product.service.ts` — usa `computeFinalPrice` + `computeProductMargin` (costo admin)
- `bundle.service.ts` — usa `computeBundleTotal`; persiste límites de
  personalización por sorpresa (`customizationMinProducts` /
  `customizationMaxProducts`). El rango es `1 ≤ min ≤ max ≤ 100`, con
  defaults 8/20, y la composición base debe cumplirlo. Create/update
  validan productos activos, IDs únicos y el rango antes de escribir.
- `pack.service.ts` — `computePackReference` (dual qty) + `computeFinalPrice` + `computePackAvailableQuantity` / `listPackStockShortages`; ítems `packageQuantity` + `unitQuantity`
- Tras create/update/soft-delete: `bumpCatalogVersionSafe` → `catalog.bump_catalog_version()` (Broadcast a ecommerce)

## Repositories (`repositories/`)

- `category.repository.ts` — `listCategoriesPageRepo` (search name/slug, status, orden `sort_order`)
- `product.repository.ts` — `listProductsPageRepo` (search name/sku, categoryId, status, orden `name`)
- `bundle.repository.ts` — `listBundlesPageRepo` (search name, status, orden `created_at desc`)
- `pack.repository.ts` — `listPacksPageRepo` (search name/sku, status, orden `created_at desc`)
- `surprise-container.repository.ts` — `listSurpriseContainersPageRepo` (search name/sku, status incl. `outOfStock`, orden `name`)
- `catalog-cache-meta.repository.ts` — `bumpCatalogVersionSafe` (RPC; no lanza)

## Caché tienda

Mutaciones de catálogo (y confirmación de pago con deduct en orders) hacen bump de `catalog.catalog_cache_meta.version_at` para invalidar listados ecommerce vía Realtime. Ver [`50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Rutas admin

| Ruta                                       | Container                 |
| ------------------------------------------ | ------------------------- |
| `/categories`                              | `category-list.container` |
| `/categories/new`, `/categories/[id]/edit` | `category-form.container` |
| `/products`                                | `product-list.container`  |
| `/products/new`, `/products/[id]/edit`     | `product-form.container`  |
| `/bundles`                                 | `bundle-list.container`   |
| `/bundles/new`, `/bundles/[id]/edit`       | `bundle-form.container`   |
| `/packs`                                   | `pack-list.container`     |
| `/packs/new`, `/packs/[id]/edit`           | `pack-form.container`     |

## Validaciones (Zod)

`@de-tin-marin/validations/category` · `product` · `bundle` · `pack` · `prices` · **`admin-list`** (paginación/filtros de listados)

### Límites configurables de sorpresa

El formulario bundle expone mínimo y máximo de productos distintos que el
cliente puede dejar en una sorpresa personalizada. Son datos de la plantilla,
no ajustes de cada pedido:

- DB: `catalog.bundles.customization_min_products` /
  `customization_max_products` (migración `00025`; backfill 8/20).
- Shared: `resolveBundleCustomizationBounds` y
  `validateBundleCustomization` en
  `@de-tin-marin/validations/customize-bundle`.
- Consumidores: wizard ecommerce y preview/create del order-form admin.
- La UI puede mostrar productos históricos inactivos al editar, pero write
  rechaza productos inactivos; no habilitar el switch de inactivos como forma
  de eludir esa validación.

Contrato de negocio: [`docs/business-rules.md`](../../../docs/business-rules.md)
Reglas 6–7; detalle de orden: [`docs/orders.md`](../../../docs/orders.md).

## Auth

Todas las actions: `guardAction` + `requireStaff` → `core.user_roles`.

## Paginación listados

Ver brief [S3B/01-admin-list-pagination.md](../../../docs/stages/S3B/01-admin-list-pagination.md). Default `ADMIN_DEFAULT_PAGE_SIZE = 5`. UI: `AdminTablePagination`; URL: `shared/helpers/admin-list-url.ts`. Prefetch: `page.tsx` + `createAdminQueryClient` + `HydrationBoundary`.

## Product search picker

`components/product-search-picker/` — usado en pack-form, bundle-form y order-form.

| Detalle       | Valor                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundary      | `listProductsPageAction` (`status` default `"active"`)                                                                                                                           |
| pageSize      | `ADMIN_DEFAULT_PAGE_SIZE` (hoy **5**)                                                                                                                                            |
| Búsqueda      | Debounce 300 ms; reset de página/acumulado al cambiar search/status                                                                                                              |
| Paginación UI | Scroll infinito (`IntersectionObserver` + sentinel); sin botón “Cargar más”                                                                                                      |
| excludeIds    | Filtra en cliente; si la página visible queda vacía y hay más total, pide la siguiente sola                                                                                      |
| UI fila       | Thumb (`imageUrl` o placeholder), nombre, precio unidad (`unitNetPrice`), und./presentación si `productType === "package"` o `itemsPerPackage > 1` (`shouldShowItemsPerPackage`) |
| Colaterales   | `*.types.ts`, `*.helpers.ts`, `*.test.tsx`                                                                                                                                       |

No sustituye la validación de write (create/update solo productos activos — Regla 6 / 23).

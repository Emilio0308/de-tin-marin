# Catálogo — módulo admin

CRUD de categorías, productos, sorpresas (bundles) y **combos (packs)** en `apps/admin`.

Briefs: [S1A](../../../docs/stages/S1A/01-catalog-products-categories.md) · [S1B](../../../docs/stages/S1B/01-bundles.md) · [S1D](../../../docs/stages/S1D/01-products-packages-stock.md) · [S1F](../../../docs/stages/S1F/01-catalog-packs.md) · [S4/02](../../../docs/stages/S4/02-product-cost-margin.md) _(costo/margen)_

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema catalog
```

## Server Actions (`actions/`)

| Action                             | Service                             | Descripción                                             |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| `listCategoriesAction`             | `listCategoriesService`             | Listado completo (selects/forms)                        |
| `listCategoriesPageAction`         | `listCategoriesPageService`         | Listado paginado (SQL `count` + `range`)                |
| `getCategoryAction`                | `getCategoryService`                | Detalle por id                                          |
| `createCategoryAction`             | `createCategoryService`             | Crear                                                   |
| `updateCategoryAction`             | `updateCategoryService`             | Editar                                                  |
| `softDeleteCategoryAction`         | `softDeleteCategoryService`         | Soft-delete                                             |
| `listProductsAction`               | `listProductsService`               | Listado completo + `finalPrice` + costo/margen          |
| `listProductsPageAction`           | `listProductsPageService`           | Listado paginado (`search`/`categoryId`/`status`)       |
| `getProductAction`                 | `getProductService`                 | Detalle por id                                          |
| `createProductAction`              | `createProductService`              | Crear (+ `costNetPrice` opcional)                       |
| `updateProductAction`              | `updateProductService`              | Editar                                                  |
| `softDeleteProductAction`          | `softDeleteProductService`          | Soft-delete                                             |
| `listBundlesAction`                | `listBundlesService`                | Listado completo + total calculado                      |
| `listBundlesPageAction`            | `listBundlesPageService`            | Listado paginado (`search`/`status`)                    |
| `getBundleAction`                  | `getBundleService`                  | Detalle + items                                         |
| `createBundleAction`               | `createBundleService`               | Crear                                                   |
| `updateBundleAction`               | `updateBundleService`               | Editar                                                  |
| `softDeleteBundleAction`           | `softDeleteBundleService`           | Soft-delete                                             |
| `listPacksAction`                  | `listPacksService`                  | Listado completo combos + `finalPrice`                  |
| `listPacksPageAction`              | `listPacksPageService`              | Listado paginado (`search`/`status`)                    |
| `getPackAction`                    | `getPackService`                    | Detalle + items + reference/normal                      |
| `createPackAction`                 | `createPackService`                 | Crear (`normal >= reference`)                           |
| `updatePackAction`                 | `updatePackService`                 | Editar                                                  |
| `softDeletePackAction`             | `softDeletePackService`             | Soft-delete                                             |
| `listSurpriseContainersAction`     | `listSurpriseContainersService`     | Listado completo envases (selects)                      |
| `listSurpriseContainersPageAction` | `listSurpriseContainersPageService` | Listado paginado (`search`/`status` incl. `outOfStock`) |
| `listActiveCampaignsAction`        | —                                   | Campañas activas para select de pack                    |

Listados admin (`/categories`, `/products`, `/bundles`, `/packs`, `/containers`): paginación SQL real (`count: "exact"` + `.range()`) vía `*PageRepo` → `*PageService` → `*PageAction`, con `page`/`pageSize`/`search`/`status` (y `categoryId` en productos) parseados con `@de-tin-marin/validations/admin-list`. Los `list*Action()` sin sufijo `Page` se conservan para selects de formularios (dropdowns) que necesitan el catálogo completo.

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
- `bundle.service.ts` — usa `computeBundleTotal`
- `pack.service.ts` — `computePackReference` + `computeFinalPrice`
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

## Auth

Todas las actions: `guardAction` + `requireStaff` → `core.user_roles`.

## Paginación listados

Ver brief [S3B/01-admin-list-pagination.md](../../../docs/stages/S3B/01-admin-list-pagination.md). UI compartida: `AdminTablePagination`; URL: `shared/helpers/admin-list-url.ts`.

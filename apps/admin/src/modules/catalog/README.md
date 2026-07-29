# Catálogo — módulo admin

CRUD de categorías, productos, sorpresas (bundles) y **combos (packs)** en `apps/admin`.

Briefs: [S1A](../../../docs/stages/S1A/01-catalog-products-categories.md) · [S1B](../../../docs/stages/S1B/01-bundles.md) · [S1D](../../../docs/stages/S1D/01-products-packages-stock.md) · [S1F](../../../docs/stages/S1F/01-catalog-packs.md)

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema catalog
```

## Server Actions (`actions/`)

| Action                      | Service                     | Descripción                          |
| --------------------------- | --------------------------- | ------------------------------------ |
| `listCategoriesAction`      | `listCategoriesService`     | Listado categorías                   |
| `getCategoryAction`         | `getCategoryService`        | Detalle por id                       |
| `createCategoryAction`      | `createCategoryService`     | Crear                                |
| `updateCategoryAction`      | `updateCategoryService`     | Editar                               |
| `softDeleteCategoryAction`  | `softDeleteCategoryService` | Soft-delete                          |
| `listProductsAction`        | `listProductsService`       | Listado + `finalPrice`               |
| `getProductAction`          | `getProductService`         | Detalle por id                       |
| `createProductAction`       | `createProductService`      | Crear                                |
| `updateProductAction`       | `updateProductService`      | Editar                               |
| `softDeleteProductAction`   | `softDeleteProductService`  | Soft-delete                          |
| `listBundlesAction`         | `listBundlesService`        | Listado + total calculado            |
| `getBundleAction`           | `getBundleService`          | Detalle + items                      |
| `createBundleAction`        | `createBundleService`       | Crear                                |
| `updateBundleAction`        | `updateBundleService`       | Editar                               |
| `softDeleteBundleAction`    | `softDeleteBundleService`   | Soft-delete                          |
| `listPacksAction`           | `listPacksService`          | Listado combos + `finalPrice`        |
| `getPackAction`             | `getPackService`            | Detalle + items + reference/normal   |
| `createPackAction`          | `createPackService`         | Crear (`normal >= reference`)        |
| `updatePackAction`          | `updatePackService`         | Editar                               |
| `softDeletePackAction`      | `softDeletePackService`     | Soft-delete                          |
| `listActiveCampaignsAction` | —                           | Campañas activas para select de pack |

## Services (`services/`)

- `category.service.ts`
- `product.service.ts` — usa `computeFinalPrice` para listado
- `bundle.service.ts` — usa `computeBundleTotal`
- `pack.service.ts` — `computePackReference` + `computeFinalPrice`
- Tras create/update/soft-delete: `bumpCatalogVersionSafe` → `catalog.bump_catalog_version()` (Broadcast a ecommerce)

## Repositories (`repositories/`)

- `category.repository.ts`
- `product.repository.ts`
- `bundle.repository.ts`
- `pack.repository.ts`
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

`@de-tin-marin/validations/category` · `product` · `bundle` · `pack` · `prices`

## Auth

Todas las actions: `guardAction` + `requireStaff` → `core.user_roles`.

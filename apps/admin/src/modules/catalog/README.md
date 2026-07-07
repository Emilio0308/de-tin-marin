# Catálogo — módulo admin

CRUD de categorías, productos y paquetes (bundles) en `apps/admin`.

Briefs: [S1A](../../../docs/stages/S1A/01-catalog-products-categories.md) · [S1B](../../../docs/stages/S1B/01-bundles.md) · [S1D](../../../docs/stages/S1D/01-products-packages-stock.md) _(presentaciones + stock)_

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema catalog
```

## Server Actions (`actions/`)

| Action                     | Service                     | Descripción               |
| -------------------------- | --------------------------- | ------------------------- |
| `listCategoriesAction`     | `listCategoriesService`     | Listado categorías        |
| `getCategoryAction`        | `getCategoryService`        | Detalle por id            |
| `createCategoryAction`     | `createCategoryService`     | Crear                     |
| `updateCategoryAction`     | `updateCategoryService`     | Editar                    |
| `softDeleteCategoryAction` | `softDeleteCategoryService` | Soft-delete               |
| `listProductsAction`       | `listProductsService`       | Listado + `finalPrice`    |
| `getProductAction`         | `getProductService`         | Detalle por id            |
| `createProductAction`      | `createProductService`      | Crear                     |
| `updateProductAction`      | `updateProductService`      | Editar                    |
| `softDeleteProductAction`  | `softDeleteProductService`  | Soft-delete               |
| `listBundlesAction`        | `listBundlesService`        | Listado + total calculado |
| `getBundleAction`          | `getBundleService`          | Detalle + items           |
| `createBundleAction`       | `createBundleService`       | Crear                     |
| `updateBundleAction`       | `updateBundleService`       | Editar                    |
| `softDeleteBundleAction`   | `softDeleteBundleService`   | Soft-delete               |

## Services (`services/`)

- `category.service.ts`
- `product.service.ts` — usa `computeFinalPrice` para listado
- `bundle.service.ts` — usa `computeBundleTotal`

## Repositories (`repositories/`)

- `category.repository.ts`
- `product.repository.ts`
- `bundle.repository.ts`

## Rutas admin

| Ruta                                       | Container                 |
| ------------------------------------------ | ------------------------- |
| `/categories`                              | `category-list.container` |
| `/categories/new`, `/categories/[id]/edit` | `category-form.container` |
| `/products`                                | `product-list.container`  |
| `/products/new`, `/products/[id]/edit`     | `product-form.container`  |
| `/bundles`                                 | `bundle-list.container`   |
| `/bundles/new`, `/bundles/[id]/edit`       | `bundle-form.container`   |

## Validaciones (Zod)

`@de-tin-marin/validations/category` · `product` · `bundle` · `prices`

## Auth

Todas las actions: `guardAction` + `requireStaff` → `core.user_roles`.

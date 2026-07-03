# S1A · Catálogo — Products + Categories (admin)

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Etapa**      | S1A — Catálogo ([roadmap.md](../../roadmap.md) § S1A)           |
| **Owner**      | Equipo De Tin Marín                                             |
| **App(s)**     | `apps/admin`                                                    |
| **Schemas**    | `catalog`                                                       |
| **Depende de** | [S0/01-monorepo-foundation.md](../S0/01-monorepo-foundation.md) |
| **Estado**     | approved                                                        |

## Contexto (leer esto, no todo docs/)

- S0 ✅ — monorepo, `core.*` con RLS, Supabase remoto vinculado.
- Modelo acordado: `image_url` (no `product_images`), `brand text`, categorías planas, `slug`, `sku`, `stock_quantity`.
- Precios JSONB en `prices.normal` — Regla 2 ([business-rules.md](../../business-rules.md)); IGV 18% calculado en formulario.
- Admin CRUD requiere auth staff + `core.user_roles` ([rules/10-auth-and-authorization.md](../../rules/10-auth-and-authorization.md)).
- Capas: Action → Service → Repository ([architecture.md](../../architecture.md)); componentes container/presentational ([rules/85-react-components.md](../../rules/85-react-components.md)).

## Objetivo

Un usuario staff autenticado en admin (:3001) puede crear, listar, editar y soft-delete categorías y productos con SKU único, precios válidos y categoría asignada.

## Scope IN

- Migración `00002_catalog_products_categories.sql` + pgTAP
- Validaciones Zod: `prices`, `category`, `product` en `@de-tin-marin/validations`
- Auth mínima: login, `requireStaff`, layout dashboard protegido
- Módulo `apps/admin/src/modules/catalog/` (repos, services, actions, DTOs, UI)
- UI: listado + formulario categorías y productos
- Primitivos UI: Input, Label, Textarea, Select, Table, Badge

## Scope OUT (traps)

- **NO `product_images`** — S1A usa `image_url` → _scope creep_
- **NO `catalog.brands`** — marca es texto → _over-engineering_
- **NO `campaign_id` / `finalPrice`** → S1C → _pricing boundary violation_
- **NO Supabase Storage upload** — solo URL texto → _scope creep_
- **NO ecommerce UI** → S3A
- **NO bundles** → S1B
- **NO deduct stock** → S2A (columna `stock_quantity` sí se edita)
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)       | ¿Nueva? | Ops                                          | Política (prosa)                         | pgTAP |
| -------------------- | ------- | -------------------------------------------- | ---------------------------------------- | ----- |
| `catalog.categories` | sí      | SELECT público activos; staff all; CUD staff | `supabase/tests/catalog__categories.sql` |
| `catalog.products`   | sí      | SELECT público activos; staff all; CUD staff | `supabase/tests/catalog__products.sql`   |

## Boundaries y DTOs

| Boundary             | Tipo          | Input (Zod)                 | Output DTO (allowlist)                                                                                    |
| -------------------- | ------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `listCategories`     | Server Action | —                           | `{ id, name, slug, isActive, sortOrder }[]`                                                               |
| `createCategory`     | Server Action | `createCategoryInputSchema` | `{ ok, id? }`                                                                                             |
| `updateCategory`     | Server Action | `updateCategoryInputSchema` | `{ ok }`                                                                                                  |
| `softDeleteCategory` | Server Action | `{ id: uuid }`              | `{ ok }`                                                                                                  |
| `listProducts`       | Server Action | —                           | `{ id, sku, name, slug, brand, categoryId, categoryName, netPrice, stockQuantity, isActive, imageUrl }[]` |
| `createProduct`      | Server Action | `createProductInputSchema`  | `{ ok, id? }`                                                                                             |
| `updateProduct`      | Server Action | `updateProductInputSchema`  | `{ ok }`                                                                                                  |
| `softDeleteProduct`  | Server Action | `{ id: uuid }`              | `{ ok }`                                                                                                  |

## Rules que aplican

- Invariantes **1, 2, 3, 4** ([CLAUDE.md](../../../CLAUDE.md))
- [`rules/00-architecture.md`](../../rules/00-architecture.md)
- [`rules/10-auth-and-authorization.md`](../../rules/10-auth-and-authorization.md)
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md)
- [`rules/85-react-components.md`](../../rules/85-react-components.md)

## Orden de implementación

1. Migración + pgTAP → db push → gen types
2. Validations + helpers + Vitest
3. Auth staff (login + requireStaff)
4. Repositories → Services → Actions
5. UI primitives + TanStack Query
6. CRUD categorías → CRUD productos
7. Playwright smoke + check/build

## Criterios de aceptación

- [ ] `supabase db push` aplica `00002` sin error
- [ ] Vitest — `packages/validations/src/prices.test.ts`: Regla 2
- [ ] Vitest — `packages/shared/src/slugify.test.ts`: slug básico
- [ ] pgTAP — `catalog__categories.sql`, `catalog__products.sql`
- [ ] Playwright — `apps/admin/e2e/catalog-smoke.spec.ts`: login page + nav products
- [ ] `pnpm check` + `pnpm build` verdes
- [ ] Staff puede CRUD categorías y productos en admin

## Preguntas abiertas

- Ninguna — modelo cerrado en sesión de planificación.

## Depends on

- [database.md](../../database.md) § catalog
- [DECISIONS.md](../../DECISIONS.md) #14, #15

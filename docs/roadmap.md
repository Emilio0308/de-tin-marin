# Roadmap — De Tin Marín

Implementación por etapas. Cada etapa tiene **stage briefs** en `docs/stages/` antes de codear.

## Resumen

| Etapa   | Nombre                     | Entregable                                         |
| ------- | -------------------------- | -------------------------------------------------- |
| **S0**  | Fundación                  | Monorepo, packages base, CI, Supabase spine        |
| **S1A** | Catálogo                   | Products + Categories                              |
| **S1B** | Bundles                    | Composición de sorpresas                           |
| **S1C** | Pricing + Campaigns        | Precio final en listado + campañas 1:1             |
| **S2A** | Stock v1                   | `stock_quantity` en products + deduct al pagar     |
| **S2B** | Orders                     | Órdenes, sorpresas personalizadas, snapshot        |
| **S2C** | Payments manual + Shipping | Confirmación operador, sin pasarela                |
| **S3A** | Ecommerce app              | Tienda pública                                     |
| **S3B** | Admin app                  | Backoffice                                         |
| **S4**  | Resto                      | Customers, Users, Notifications, Reports, Settings |

---

## S0 — Fundación (~1–2 semanas) ✅

**Goal:** Repo ejecutable con gates de calidad y Supabase provisionado.

- [x] Turborepo + pnpm workspaces
- [x] `packages/config`, `types`, `validations`, `db`, `ui`, `shared`
- [x] `apps/ecommerce` y `apps/admin` shells Next.js
- [x] ESLint + Prettier + Husky
- [x] `CLAUDE.md` / `AGENTS.md`
- [x] Migración spine: schemas `core`, `catalog`, `pricing`, `commerce`, `crm`
- [x] CI: `pnpm check` + build
- [x] Brief: `docs/stages/S0/01-monorepo-foundation.md`

---

## S1A — Products + Categories ✅

**Goal:** CRUD admin de productos con SKU, categorías, `prices` JSONB, `image_url` y stock.

- [x] Tablas: `catalog.categories`, `catalog.products`
- [x] Columnas producto: `sku`, `slug`, `brand`, `image_url`, `prices`, `stock_quantity`, `category_id`
- [x] Columnas categoría: `slug`, `sort_order`
- [x] Admin UI: listado + formulario + auth staff mínima
- [x] Grants de API para schemas propios (`00003_api_grants.sql`)
- [x] Manejo de errores en Server Actions (`guardAction`/`logServerError`)
- [x] Landing ecommerce (módulo `home`) + infra de tests de render (Vitest + Testing Library)
- [x] Deploy admin en Vercel (env vars declaradas en `turbo.json`)
- [x] Reglas 1–4
- [x] Brief: `docs/stages/S1A/01-catalog-products-categories.md`

**Depends on:** S0

---

## S1B — Bundles (plantillas sorpresa) ✅

**Goal:** Plantillas de sorpresas sin stock, precio dinámico desde componentes + `service_fee`.

- [x] Migración `00004_catalog_bundles.sql` + pgTAP + grants
- [x] `computeBundleTotal` en `@de-tin-marin/shared/bundle-price`
- [x] Validaciones Zod + CRUD admin (listado, formulario, soft-delete)
- [x] Precio calculado en vivo: `service_fee + quantity × Σ(precio × units_per_person)`
- [x] Reglas 5–6, DECISIONS #5–#6, #22
- [x] Brief: `docs/stages/S1B/01-bundles.md`

**Depends on:** S1A

---

## S1C — Pricing + Campaigns

**Goal:** Campañas 1:1 con productos; listado devuelve `finalPrice` desde backend.

- Tablas: `pricing.campaigns`, FK `products.campaign_id`
- Servicios: `product-price`, `bundle-line-price`
- Reglas 9–12
- Sin cupones ni VIP en v1

**Depends on:** S1A, S1B

---

## S2A — Stock v1

**Goal:** Stock en `products.stock_quantity` y descuento atómico al pagar.

- Función `deduct_stock_for_order`
- Ajuste manual admin + audit_log
- Regla 15
- Schema `inventory` → **v2**

**Depends on:** S1A, S1B

---

## S2B — Orders

**Goal:** Órdenes con productos y sorpresas personalizadas; snapshot congelado.

- Tablas: `commerce.orders`, `order_items`, `order_bundle_items`
- Personalización de plantilla al crear pedido
- Reglas 13–16

**Depends on:** S1C, S2A

---

## S2C — Payments manual + Shipping

**Goal:** Tabla `payments`, confirmación por operador, envíos. **Sin pasarela v1.**

- Tablas: `commerce.payments`, `commerce.shipments`
- Reglas 17–18

**Depends on:** S2B

---

## S3A — Ecommerce

**Goal:** Tienda funcional end-to-end.

- Catálogo, carrito, checkout, mis pedidos
- TanStack Query
- Playwright: happy path compra

**Depends on:** S2C

---

## S3B — Admin

**Goal:** Backoffice completo.

- Todos los dominios operativos
- Roles staff
- Referencia UX: ADMIN_BACKOFFICE (pantallas)

**Depends on:** S2C

---

## S4 — Completitud

- Customers (sin VIP v1)
- Users / roles
- Notifications
- Reports
- Settings
- Inventory v2 (ledger movimientos)
- Cupones, VIP, pasarela de pagos (epoch posterior)

---

## Workstreams (si hay 2+ devs)

| Dev | Vertical                         |
| --- | -------------------------------- |
| A   | Platform: S0, auth, packages, CI |
| B   | Catálogo + Pricing: S1A/B/C      |
| C   | Commerce: S2A/B/C, Payments      |

Consumir entre workstreams solo vía **DTOs declarados en briefs**.

## Definition of done (por feature)

- Brief aprobado
- Código + tests nombrados en brief
- `pnpm check` + `pnpm build` verdes
- Docs del dominio actualizados

# Roadmap — De Tin Marín

Implementación por etapas. Cada etapa tiene **stage briefs** en `docs/stages/` antes de codear.

## Resumen

| Etapa   | Nombre                     | Entregable                                         |
| ------- | -------------------------- | -------------------------------------------------- |
| **S0**  | Fundación                  | Monorepo, packages base, CI, Supabase spine        |
| **S1A** | Catálogo                   | Products + Categories                              |
| **S1B** | Bundles                    | Composición de sorpresas                           |
| **S1C** | Pricing + Campaigns        | Precio final en listado + campañas 1:1             |
| **S1D** | Presentaciones + stock     | `prices.unit`, paquetes, stock sealed/loose        |
| **S1E** | Envases + delivery         | Insumos sorpresa + tarifas por distrito (Piura)    |
| **S2B** | Orders                     | Admin + `shopping_cart` JSONB congelado            |
| **S2C** | Payments manual + Shipping | Confirmación operador → `paid`, sin pasarela       |
| **S2A** | Stock deduct al pagar      | `deduct_stock_for_order` al confirmar pago (S2C)   |
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

## S1C — Pricing + Campaigns ✅ (fundación)

**Goal:** Esquema de campañas 1:1 + `finalPrice` calculado en backend; **sin uso operativo en v1**.

- [x] Tablas: `pricing.campaigns`, FK `products.campaign_id`
- [x] Helper `computeFinalPrice` en `@de-tin-marin/shared/final-price`
- [x] Listado productos admin devuelve `finalPrice` (+ `campaign` null en v1)
- [x] **Sin CRUD admin de campañas** — activación diferida (DECISIONS #24)
- [x] Reglas 9–12 (contrato); front no recalcula
- [x] Brief: `docs/stages/S1C/01-pricing-campaigns-foundation.md`

**Depends on:** S1A, S1B

---

## S1D — Presentaciones, precios dual y stock por paquetes

**Goal:** Productos con presentación (tira/paquete), precios `normal` + `unit`, stock en paquetes cerrados + unidades sueltas.

- Migración `00008_catalog_products_packages_stock.sql` + pgTAP
- Columnas: `product_type`, `items_per_package`, `package_label`, `stock_sealed_packages`, `stock_loose_base_units`
- `prices.unit` en JSONB; coherencia con `normal` al guardar
- Backfill desde `stock_quantity`; drop columna legacy
- Admin: formulario producto + bundles usan `prices.unit.netPrice`
- Helpers: `buildPricesFromPackageNetPrice`, `normalizeProductStock`, `deductBaseUnits`
- Reglas 2, 4, 8, 9 actualizadas; DECISIONS #27–#29
- Brief: [`docs/stages/S1D/01-products-packages-stock.md`](stages/S1D/01-products-packages-stock.md)

**Depends on:** S1A, S1B, S1C

**Bloquea:** S2A (deduct usa algoritmo sealed/loose)

---

## S1E — Envases de sorpresa + delivery ✅

**Goal:** Insumos de envase (tabla aparte de productos) con stock y precio; bundles referencian envase en lugar de `service_fee`; tarifas de delivery configurables por distrito.

- [x] Migración `00009_surprise_containers_delivery.sql` + pgTAP
- [x] Tablas: `catalog.surprise_containers`, `pricing.delivery_zones`, `pricing.delivery_settings`
- [x] Alter `catalog.bundles`: `container_id`; drop `service_fee`
- [x] Admin: CRUD envases, CRUD zonas delivery, bundle/order actualizados
- [x] Seed distritos Piura: Piura, Castilla, 26 de Octubre, La Unión, Catacaos
- [x] `shopping_cart` bundle: `container` congelado (compat legacy `serviceFee`)
- Brief: [`docs/stages/S1E/01-surprise-containers-delivery.md`](stages/S1E/01-surprise-containers-delivery.md)

**Depends on:** S1B, S1D, S2B

**Bloquea:** S2A (deduct envases), S3A (checkout delivery)

---

## S2B — Orders ✅

**Goal:** Órdenes con productos y sorpresas personalizadas; snapshot congelado.

- [x] Tabla `commerce.orders` con `shopping_cart` JSONB (Order shopping cart congelado)
- [x] Admin: crear, listar, detalle, cancelar (`pending_payment`)
- [x] Personalización de plantilla al crear pedido (desde template bundle)
- [x] Reglas 13–14, 16
- [x] Brief: `docs/stages/S2B/01-orders.md`
- **Sin descuento de stock** → S2A
- **Sin confirmar pago** → S2C

**Depends on:** S1C

---

## S2C — Payments manual + Shipping ✅

**Goal:** Tabla `payments`, confirmación por operador, envíos. **Sin pasarela v1.**

- [x] Migración `00007_commerce_payments_shipments.sql` + pgTAP
- [x] Tablas: `commerce.payments`, `commerce.shipments`
- [x] Operador confirma pago → orden `paid`
- [x] Admin: envío (tracking, carrier, estados)
- [x] Reglas 17–18
- [x] Brief: [`docs/stages/S2C/01-payments-shipping.md`](stages/S2C/01-payments-shipping.md)
- **Sin descuento de stock** → S2A

**Depends on:** S2B

---

## S2A — Stock deduct al pagar ✅

**Goal:** Descuento atómico en **unidades base** (algoritmo sealed/loose) + envases cuando la orden pasa a `paid` (confirmación manual del operador en S2C).

- [x] Migración `00010_deduct_stock_for_order.sql` + pgTAP
- [x] RPC `commerce.confirm_payment_with_stock_deduct` (atómico con deduct)
- [x] `checkOrderStock` en `@de-tin-marin/shared`
- [x] Admin: warning stock + error `INSUFFICIENT_STOCK` al confirmar
- Brief: [`docs/stages/S2A/01-stock-deduct-on-payment.md`](stages/S2A/01-stock-deduct-on-payment.md)

**Depends on:** S1D, S1E, S2C

---

## S3A — Ecommerce

**Goal:** Tienda funcional end-to-end.

- Catálogo, carrito, checkout, mis pedidos
- TanStack Query
- Playwright: happy path compra

**Depends on:** S2A

---

## S3B — Admin

**Goal:** Backoffice completo.

- Todos los dominios operativos
- Roles staff
- Referencia UX: ADMIN_BACKOFFICE (pantallas)

**Depends on:** S2A

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
| B   | Catálogo + Pricing: S1A/B/C/D    |
| C   | Commerce: S2B/C, S1D, luego S2A  |

Consumir entre workstreams solo vía **DTOs declarados en briefs**.

## Definition of done (por feature)

- Brief aprobado
- Código + tests nombrados en brief
- `pnpm check` + `pnpm build` verdes
- Docs del dominio actualizados

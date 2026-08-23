# Roadmap — De Tin Marín

Implementación por etapas. Cada etapa tiene **stage briefs** en `docs/stages/` antes de codear.

## Resumen

| Etapa   | Nombre                     | Entregable                                        |
| ------- | -------------------------- | ------------------------------------------------- |
| **S0**  | Fundación                  | Monorepo, packages, CI, Supabase spine, media CDN |
| **S1A** | Catálogo                   | Products + Categories                             |
| **S1B** | Bundles                    | Composición de sorpresas                          |
| **S1C** | Pricing + Campaigns        | Precio final en listado + campañas 1:1            |
| **S1D** | Presentaciones + stock     | `prices.unit`, paquetes, stock sealed/loose       |
| **S1E** | Envases + delivery         | Insumos sorpresa + tarifas por distrito (Piura)   |
| **S1F** | Packs / Combos             | Combos BOM fija + precio reference/normal (admin) |
| **S2B** | Orders                     | Admin + `shopping_cart` JSONB congelado           |
| **S2C** | Payments manual + Shipping | Confirmación operador → `paid`, sin pasarela      |
| **S2A** | Stock deduct al pagar      | `deduct_stock_for_order` al confirmar pago (S2C)  |
| **S3A** | Ecommerce app              | Tienda pública end-to-end (S3A-0…5, incl. combos) |
| **S3B** | Admin app                  | Backoffice                                        |
| **S4**  | Completitud                | Reports (Excel catálogo) + Customers, Users, …    |

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
- [x] Media CDN: S3 + CloudFront (CDK) — [`docs/infra.md`](infra.md) · [S0/02](stages/S0/02-infra-media-cdn.md)
- [x] Admin upload imágenes catálogo (presign) — packs · products · bundles · containers · [S0/03](stages/S0/03-admin-pack-image-upload.md)

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

## S1F — Packs / Combos (admin)

**Goal:** Combos vendibles con BOM fija de dulces (presentaciones), precio `reference`/`normal`, campaña 1:1, min/max; stock vía componentes al `paid`.

- [x] Migración `00016_catalog_packs.sql` + pgTAP
- [x] Tablas: `catalog.packs`, `catalog.pack_items`
- [x] Shared: pack-price, order-cart `type: pack`, check/deduct stock
- [x] Admin: CRUD Combos + línea pack en órdenes
- Brief: [`docs/stages/S1F/01-catalog-packs.md`](stages/S1F/01-catalog-packs.md)

**Depends on:** S1A, S1C, S1D, S2A, S2B

**Bloquea:** —

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

**Evoluciones post-S2B (canónico en [`orders.md`](orders.md)):**

- `surcharge_total` (`00023`) + tabs Totales admin (precio final XOR / discount+surcharge)
- Línea product dual `packageQuantity`+`unitQuantity` (`00024`); admin sueltas; ecommerce solo presentaciones
- Packs en carrito (S1F/S4-04); admin salta min/max (Regla 21)

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

**Goal:** Descuento atómico al `paid`: líneas product en **presentaciones**; bundles en **unidad base**; `package` abre sealed/loose; `unit` solo loose; + envases.

- [x] Migración `00010_deduct_stock_for_order.sql` + fix `00014_fix_deduct_stock_product_types.sql` + pgTAP
- [x] RPC `commerce.confirm_payment_with_stock_deduct` (atómico con deduct)
- [x] `checkOrderStock` / `deductProductStock` en `@de-tin-marin/shared`
- [x] Admin: warning stock + error `INSUFFICIENT_STOCK` al confirmar
- Brief: [`docs/stages/S2A/01-stock-deduct-on-payment.md`](stages/S2A/01-stock-deduct-on-payment.md)

**Depends on:** S1D, S1E, S2C

---

## S3A — Ecommerce (tienda pública)

**Goal:** Tienda funcional end-to-end para guest: catálogo, personalizar sorpresa, carrito, checkout Piura, confirmación y consulta de pedido.

**Depends on:** S2A

### S3A-0 — Fundación ecommerce

- Módulos `catalog`, `cart`, `checkout`, `orders`
- TanStack Query, `guardAction`, i18n base
- Extraer lógica `createOrder` a `@de-tin-marin/shared`
- Feature flags: `enableUnitsPerPerson`, `pickupEnabled` (tienda, no puntos S4-08), `strictStockValidationOnCheckout`
- Home sin mocks; CTAs a catálogo
- Brief: [`docs/stages/S3A/00-ecommerce-foundation.md`](stages/S3A/00-ecommerce-foundation.md)

### S3A-1 — Catálogo productos + sorpresas

- `/productos`, `/sorpresas` — paginación, categoría, búsqueda nombre/SKU, orden nombre/precio
- Stock visible; inactivos ocultos; `finalPrice` backend; sin campañas v1
- Remediación paginación SQL: [`docs/stages/S3A/01-remediation-catalog-pagination-sql.md`](stages/S3A/01-remediation-catalog-pagination-sql.md) (S3A-1-R)
- Brief: [`docs/stages/S3A/01-catalog-products-bundles.md`](stages/S3A/01-catalog-products-bundles.md)

**Depends on:** S3A-0

### S3A-2 — Wizard personalizar sorpresa

- Mín./máx. de productos distintos **configurable por plantilla**:
  `customization_min_products` / `customization_max_products` (defaults
  8/20; `1 ≤ min ≤ max ≤ 100`; migración `00025`). La composición inicial,
  wizard, preview y creación de orden revalidan el rango.
- Plantilla editable; `bundles.quantity` = sorpresas de plantilla. En
  ecommerce/guest `line.quantity` editable (**15–100**), init =
  `clamp(bundles.quantity, 15, 100)`, preview + revalidación en checkout
  (admin no usa ese rango)
- `enableUnitsPerPerson=false`; stock warning only
- Brief: [`docs/stages/S3A/02-bundle-customization-wizard.md`](stages/S3A/02-bundle-customization-wizard.md)

**Depends on:** S3A-1

### S3A-3 — Carrito + checkout

- Carrito localStorage (`CartRepository` intercambiable)
- Checkout delivery Piura + mapa OSM; fuera de cobertura = no crea orden
  (toast al submit; no deshabilitar el botón por cobertura)
- Recojo en tienda oculto (`pickupEnabled`). Puntos de recojo: S4-08
- RLS guest insert órdenes; `createGuestOrder`
- Brief: [`docs/stages/S3A/03-cart-checkout.md`](stages/S3A/03-cart-checkout.md)

**Depends on:** S3A-2

### S3A-4 — Confirmación + mis pedidos guest ✅

- Pantalla confirmación + instrucciones pago manual
- Lookup email + orderNumber vía RPC
- Brief: [`docs/stages/S3A/04-order-confirmation-guest-lookup.md`](stages/S3A/04-order-confirmation-guest-lookup.md)

**Depends on:** S3A-3

### S3A-05 — Combos (packs) en ecommerce

- Tab `/?tab=combos` + `/combos/[slug]`
- Add-to-cart sin wizard; checkout guest con `type: pack`
- Brief: [`docs/stages/S3A/05-catalog-packs-ecommerce.md`](stages/S3A/05-catalog-packs-ecommerce.md)

**Depends on:** S1F, S3A-4

**E2E:** Playwright happy path por sub-etapa (S3A-1…4)

---

## S3B — Admin

**Goal:** Backoffice completo.

- Todos los dominios operativos
- Roles staff
- Referencia UX: ADMIN_BACKOFFICE (pantallas)
- [x] Paginación SQL listados: [`docs/stages/S3B/01-admin-list-pagination.md`](stages/S3B/01-admin-list-pagination.md) (default pageSize **5**; SSR + hidratación RQ)
- [x] Home ecommerce SSR (`loadStorefrontCatalog`) + admin listados SSR; `ProductSearchPicker` en forms

**Depends on:** S2A

---

## S4 — Completitud

### S4-01 — Export Excel estado de catálogo (admin) ✅

**Goal:** Staff descarga `.xlsx` multi-hoja desde el dashboard (productos, sorpresas, packs, envases, órdenes + carrito congelado).

- [x] Módulo `apps/admin/src/modules/reports/`
- [x] Shared `pack-availability` (Regla 22) — admin + ecommerce
- [x] Panel en home dashboard + `exportCatalogStatusAction`
- Brief: [`docs/stages/S4/01-catalog-status-excel.md`](stages/S4/01-catalog-status-excel.md)

**Depends on:** S1A, S1B, S1C, S1E, S1F, S2B

### S4-02 — Costo de venta y margen (productos admin) ✅

**Goal:** Staff carga `cost_net_price`; ve margen/% en form/listado; Excel Productos incluye Costo, Margen, Margen %.

- [x] Migración `00019_product_cost_net_price.sql`
- [x] Shared `product-margin` (`computeProductMargin`)
- [x] Admin form/list + Excel S4-01
- Brief: [`docs/stages/S4/02-product-cost-margin.md`](stages/S4/02-product-cost-margin.md)

**Depends on:** S1A, S1D, S4-01

### S4-03 — Hero dinámico + Personalización web ✅

**Goal:** Staff configura imágenes del hero (home ecommerce) con modo estático/carrusel, orden y vigencia; ecommerce las muestra con fallback a la imagen hardcodeada actual. La misma pantalla `/web-customization` es el hub de personalización visual (hero + Nosotros vía S4-07).

- [x] Tablas `core.hero_settings` + `core.hero_images` (migración `00020`)
- [x] Admin `/web-customization` + folder S3 `hero` + validación aspecto cuadrado
- [x] Ecommerce `getPublicHeroConfig` + hero static/carousel + fallback
- Brief: [`docs/stages/S4/03-hero-web-customization.md`](stages/S4/03-hero-web-customization.md)

**Depends on:** S0-03 media ✅, S3A home ✅

### S4-04 — Pack BOM dual (`package_quantity` + `unit_quantity`) ✅

**Goal:** Un componente de combo puede mezclar presentaciones y unidades base en la misma fila; reference, disponibilidad, carrito y deduct al `paid` respetan ambas cantidades.

- [x] Migración `00022_pack_items_unit_quantity.sql` + pgTAP
- [x] Shared: `pack-price`, `pack-availability`, `order-cart`, `check-order-stock`
- [x] Admin pack-form (dos steppers) + orders/reports; ecommerce detalle/checkout
- Brief: [`docs/stages/S4/04-pack-dual-quantities.md`](stages/S4/04-pack-dual-quantities.md)

**Depends on:** S1F ✅, S2A ✅, S3A-05 ✅

### S4-05 — Contacto e instrucciones de pago dinámicas ✅

**Goal:** Staff mantiene una única configuración pública de contacto, Yape y
transferencia; ecommerce la consume sin valores de cobro hardcodeados.

- [x] Migración `00026_public_business_settings.sql` + pgTAP de RLS/singleton
- [x] Admin `/business-settings`, actions staff y validación compartida
- [x] Ecommerce: FAB WhatsApp, páginas legales/Nosotros y confirmación/lookup
      de pedidos pendientes
- [x] DTO allowlist público + caché React Query de 5 min

**Depends on:** S2C ✅, S3A-04 ✅

### S4-06 — Notificaciones email al crear orden

**Goal:** Tras crear una orden, enviar correo SMTP best-effort (Nodemailer):
ecommerce → cliente + admin; admin create → solo admin. Create-order **await**
el envío (sin `after()`); fallo de mail no tumba la orden.

- [x] Package `@de-tin-marin/notifications` + templates HTML/text
- [x] Env SMTP + `ORDER_NOTIFY_EXTRA_EMAILS` opcional
- [x] Hooks en `createGuestOrderService` y `createOrderService`
- Brief: [`docs/stages/S4/06-order-email-notifications.md`](stages/S4/06-order-email-notifications.md)

**Depends on:** S3A-3 ✅, S3A-4 ✅, S4-05 ✅, S2B ✅

### S4-07 — Imagen personalizable en Nosotros ✅

**Goal:** Staff configura la foto de “Nuestra Historia” (`/nosotros`) desde Personalización web; ecommerce la muestra en SSR con fallback al placeholder actual.

- [x] Tabla `core.about_page_settings` (migración `00027`)
- [x] Admin `/web-customization` sección Nosotros + folder S3 `about` + validación landscape
- [x] Ecommerce SSR + fallback `ABOUT_STORY_IMAGE_URL`
- Brief: [`docs/stages/S4/07-about-page-image.md`](stages/S4/07-about-page-image.md)

**Depends on:** S0-03 media ✅, S4-03 hero ✅

### S4-08 — Puntos de recojo ✅

**Goal:** Staff cataloga puntos de recojo (nombre, mapa, fee); checkout guest
elige `delivery` o `pickup_point`. El recojo en tienda (`pickup`) sigue
siendo solo admin.

- [x] Migración `00028_pickup_points.sql` + RPC guest XOR + pgTAP
- [x] Admin `/delivery` pestaña puntos + kill switch `pickup_points_enabled`
- [x] Checkout, order-form, detalle/confirmación y emails
- Brief: [`docs/stages/S4/08-pickup-points.md`](stages/S4/08-pickup-points.md)

**Depends on:** S1E ✅, S2B ✅, S3A-3 ✅

### S4-09 — Cancelación atómica (refund + restock) ✅

**Goal:** Un solo control admin «Cancelar»: sin deduct → solo `cancelled`;
post-pago → RPC atómica (payments `refunded` + restock + `cancelled`).
Sin reembolso suelto de payment.

- [x] Migración `00029_cancel_order_with_restock.sql` + pgTAP
- [x] `cancelOrderService` → RPC; transition a `cancelled` delega; bump catálogo
- [x] UI: Cancelar en paid/preparing/ready; quitar Reembolsar (`USE_CANCEL_ORDER`)
- Brief: [`docs/stages/S4/09-cancel-atomic-restock.md`](stages/S4/09-cancel-atomic-restock.md)

**Depends on:** S2A ✅, S2B ✅, S2C ✅

### Pendiente S4

- Customers (sin VIP v1)
- Users / roles
- Más reports (ventas, PDF, métricas)
- Settings (otros; contacto y pagos dinámicos ya implementados)
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

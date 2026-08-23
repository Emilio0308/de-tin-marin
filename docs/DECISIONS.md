# DECISIONS — Ledger de decisiones De Tin Marín

> **Precedencia:** donde una decisión aquí contradice otro doc, **este ledger gana**. Actualizar docs afectados al resolver cada ítem.
>
> **Firmado:** 2026-07-02 — Paso 1 completado.

| #   | Tema                      | Estado | Resolución                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Monorepo                  | ✅     | pnpm + Turborepo; apps `ecommerce` + `admin`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | Auth boundary             | ✅     | Supabase Auth; RLS como frontera real                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 3   | API layer                 | ✅     | Server Actions (in-app); `/api/v1` reservado para futuro                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | Pricing vs Orders         | ✅     | Precios calculados en backend al listar/crear orden; Orders congela snapshot — nunca recalcula post-checkout                                                                                                                                                                                                                                                                                                                                                                  |
| 5   | Stock de bundles          | ✅     | **Sin stock.** Bundles/sorpresas son plantillas por demanda; solo productos tienen stock                                                                                                                                                                                                                                                                                                                                                                                      |
| 6   | Precio de bundles         | ✅     | **Dinámico, NO persistido.** `total = service_fee + quantity × Σ(precio_unitario × units_per_person)` donde precio unitario = `prices.unit.netPrice` (post-S1D). Sin columna `prices` en `bundles`; si un producto cambia de precio, el bundle se recalcula solo                                                                                                                                                                                                              |
| 7   | Moneda                    | ✅     | **Solo PEN (soles peruanos).** `currency_code = 'PEN'` en todo el sistema                                                                                                                                                                                                                                                                                                                                                                                                     |
| 8   | Pasarela de pago          | ✅     | **No en v1.** Pagos internos; operador confirma manualmente. Tabla `commerce.payments` sí existe                                                                                                                                                                                                                                                                                                                                                                              |
| 9   | Cancelación / reembolso   | ✅     | **Manual por operador** en v1 (cambio de estado + reversión de stock manual si aplica)                                                                                                                                                                                                                                                                                                                                                                                        |
| 10  | Campañas por producto     | ✅     | **Relación 1:1** producto↔campaña. Al asignar nueva, se reemplaza la anterior. Sin campaña → `prices.normal`                                                                                                                                                                                                                                                                                                                                                                  |
| 11  | Puertos dev               | ✅     | ecommerce **3000**, admin **3001**                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 12  | Asistente IA principal    | ✅     | Cursor (`AGENTS.md`); `CLAUDE.md` para compatibilidad                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 13  | Estructura de precios     | ✅     | JSONB `prices` en producto (opción A). v1: **`normal`** (presentación) + **`unit`** (unidad base) con `netPrice`, `igv`, `subtotal`. Futuro: `suggested`, `fantasy`. Ver #28                                                                                                                                                                                                                                                                                                  |
| 14  | IGV                       | ✅     | `netPrice` = **precio final al cliente (IGV incluido).** Desglose: `subtotal` + `igv` = `netPrice`                                                                                                                                                                                                                                                                                                                                                                            |
| 15  | Stock v1                  | ✅     | **`stock_sealed_packages` + `stock_loose_base_units`** en `catalog.products` (DECISIONS #29). Schema `inventory` y ledger de movimientos → **v2**. ~~`stock_quantity`~~ eliminada en S1D                                                                                                                                                                                                                                                                                      |
| 16  | Cupones / VIP             | ✅     | **Fuera de v1.** Sin tablas ni lógica de cupones ni tier VIP                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 17  | Bundles en órdenes        | ✅     | Plantilla editable al crear orden; snapshot en `orders.shopping_cart` (Order shopping cart JSONB)                                                                                                                                                                                                                                                                                                                                                                             |
| 18  | Precio en listado         | ✅     | Backend incluye campaña activa en query de productos y devuelve **precio final** — el front no recalcula                                                                                                                                                                                                                                                                                                                                                                      |
| 19  | Nombre del proyecto       | ✅     | **`de-tin-marin`** (carpeta repo, scope npm `@de-tin-marin/*`, marca **De Tin Marín**). Reemplaza nombre provisional `candy`                                                                                                                                                                                                                                                                                                                                                  |
| 20  | Errores en Server Actions | ✅     | Cuerpo de toda action envuelto en `guardAction(scope, run)` desde `@de-tin-marin/logging` (shim en `apps/*/src/shared/errors/server-error.ts`). Emite eventos JSON `started`/`completed`/`failed` a **consola del server** (terminal / Vercel Runtime Logs). Nunca tragar errores. Admin: `UNEXPECTED` puede incluir `message`. Ecommerce: `UNEXPECTED` **sin** mensaje interno. Ver #37                                                                                      |
| 21  | Grants de schemas propios | ✅     | Exponer schema en la API **no basta**: cada migración que crea tablas en un schema propio debe incluir `GRANT USAGE` + privilegios para `anon`/`authenticated`. RLS gobierna filas. Ver `00003_api_grants.sql`                                                                                                                                                                                                                                                                |
| 22  | Modelo de bundles         | ✅     | Bundle = plantilla con `quantity` = **cantidad de sorpresas** (default al personalizar) + `container_id` (envase; #30). `bundle_items` guarda `units_per_person` por producto (**v1 fija en 1**; nombre histórico = unidades por sorpresa). Sin stock (#5), sin `prices` propio; total dinámico (#6). En ecommerce/guest, `line.quantity` (sorpresas pedidas) es editable **15–100**, init = `clamp(bundles.quantity, 15, 100)`; admin permite `quantity >= 1` sin ese rango. |
| 23  | i18n                      | ✅     | **`next-intl` sin routing por URL** en ambas apps. `defaultLocale = 'es'`; v1 solo español (`en` declarado en `@de-tin-marin/config/i18n` para habilitar sin refactor). Catálogos en `apps/<app>/messages/es.json`; config en `apps/<app>/src/i18n/request.ts`; tipos aumentados en `src/global.d.ts`. Presentacionales puros: el texto se resuelve en container/layout y baja por props o `useTranslations` en client leaves                                                 |
| 24  | Campañas v1               | ✅     | **Fundación sin uso operativo.** Esquema `pricing.campaigns` + `products.campaign_id` (1:1) + `computeFinalPrice` en backend. Sin CRUD admin ni campañas activas en v1 → `finalPrice === netPrice`. El front solo consume `finalPrice`; activación operativa en etapa posterior                                                                                                                                                                                               |
| 25  | Stock deduct — timing     | ✅     | **Regla de negocio:** descontar stock al pasar orden a `paid` (operador confirma pago manual). **Implementación:** S2A, después de S2C y **S1D**. S2B y S2C no incluyen deduct; algoritmo sealed/loose en unidades base                                                                                                                                                                                                                                                       |

| 26 | Order shopping cart | ✅ | Detalle del pedido en **`commerce.orders.shopping_cart`** (JSONB). Sin tablas `order_items` / `order_bundle_items` en v1. Productos y sorpresas (bundles) congelados al pasar a `pending_payment` |
| 27 | Presentaciones de producto | ✅ | **`product_type`** (`package` \| `unit`), **`items_per_package`** (>= 1), **`package_label`** (UX). Default histórico = `unit` + `items_per_package=1`. Líneas `type: product` dual: **`packageQuantity` + `unitQuantity`** (suma ≥ 1); frozen `packagePrice`/`unitPrice`; al build normalizar `unitQuantity >= ipp` → paquetes. **Admin** puede vender unidades base; **ecommerce/guest** solo presentaciones (`unitQuantity = 0`). Bundles consumen **unidad base**. Stock: #29 |
| 28 | Precios dual en JSONB | ✅ | **`prices.normal`** = precio presentación; **`prices.unit`** = precio unidad base. Ambos persistidos; **`unit` calculado al guardar** desde `normal` + `items_per_package` con **ceil a 2 decimales** (unidad no más barata que el paquete). Coherencia: `|unit×ipp − normal| ≤ 0.01` **o** `unit×ipp > normal` (Regla 2). Campaña aplica sobre `normal`; `finalUnitPrice` derivado |
| 29 | Stock por paquetes + tipo | ✅ | **`stock_sealed_packages`** + **`stock_loose_base_units`**. **`package`:** vendible = sealed×ipp+loose; deduct abre paquetes (`deductBaseUnits`). **`unit`:** vendible/deduct = **solo loose** (`deductUnitProductLoose`); sealed no se abre. Líneas product: `need = presentationQty × ipp + baseUnits` bundle. Migración `00014` |
| 30 | Envases de sorpresa + delivery | ✅ | **S1E.** Insumos en `catalog.surprise_containers` (no productos): stock + precio; 1 envase/sorpresa; bundles con `container_id` (drop `service_fee`). Delivery: `pricing.delivery_zones` + `pricing.delivery_settings`. Brief: `docs/stages/S1E/01-surprise-containers-delivery.md` |
| 31 | Límites de compra por producto | ✅ | **`purchase_min_quantity`** / **`purchase_max_quantity`** en `catalog.products` (presentación vendida; default **10** / **100**). `max_efectivo = min(max, stock_en_presentaciones)`; si stock < min → no comprable. **Obligatorio en ecommerce / checkout guest; jamás relajar en storefront.** Admin order-form **salta** min/max (qty ≥ 1 acotada por stock). No aplica a la composición de bundles; la **cantidad de una línea bundle ecommerce** tiene su propio rango 15–100 (#22 / Regla 7). |
| 32 | SSR vs CSR y caché de datos | ✅ | **SSR** en navegación/catálogo donde sea viable. **CSR + RQ fresco** en carrito (sync al montar) y checkout (validate al submit). **Caché cliente catálogo:** `staleTime` Infinity; invalidación vía `catalog.catalog_cache_meta.version_at` + **Realtime Broadcast** (`catalog-version`) al bump en admin/deduct. Sin poll. Sin Next.js Data Cache por defecto. Detalle: `docs/rules/50-data-fetching-cache-ssr.md` |
| 33 | Packs / combos | ✅ | **`catalog.packs` + `pack_items`**. Combo ≠ sorpresa: sin personas, sin envase, BOM fija. Una fila por producto; cantidades duales **`package_quantity`** (presentaciones) + **`unit_quantity`** (unidades base); `package_quantity + unit_quantity >= 1`. Precio JSONB `reference` = Σ(`normal × package_quantity` + `unit × unit_quantity`) + `normal` (admin); **`normal >= reference`**. Descuentos solo vía campaña 1:1 (`campaign_id`). Sin stock propio; disponibilidad en unidades base; al `paid`, `totalPackages` → `presentationQuantity` y `totalUnits` → `baseUnits` (no tocar branch bundle). Min/max compra como productos **en ecommerce**; admin order-form salta min/max (techo = `availableQuantity`). UI admin: Combos. Briefs: `docs/stages/S1F/01-catalog-packs.md`, `docs/stages/S4/04-pack-dual-quantities.md` |
| 34 | Media CDN (imágenes) | ✅ | **AWS S3 privado + CloudFront (OAC)** vía **CDK TypeScript** en `infra/cdk/`. Stacks **`MediaStaging`** y **`MediaProduction`** (entornos aislados; nombres AWS genéricos). URL CDN en `image_url`. Doc canónica: [`docs/infra.md`](infra.md). Brief: `docs/stages/S0/02-infra-media-cdn.md` |
| 35 | Upload imágenes catálogo (presign) | ✅ | Admin: **presigned PUT** diferido al **Guardar** en packs · products · bundles · containers · **hero** · **about** (`folder` S3). URL CloudFront en `image_url`. jpeg/png/webp ≤ **10 MiB**. Hero: **aspecto cuadrado 1:1** (±2 %) y lado ≥ **600 px** (S4-03). Nosotros: **landscape ~16:9** (±5 %) y ancho ≥ **800 px** (S4-07). Action `createCatalogImageUploadUrlAction`; IAM uploader en CDK. Brief: `docs/stages/S0/03-admin-pack-image-upload.md` · S4-03 · S4-07 · [`infra.md`](infra.md) |
| 36 | Costo de venta producto | ✅ | Columna **`catalog.products.cost_net_price`** (nullable, `>= 0`). Margen y % **derivados** (no persistidos): `margin = prices.normal.netPrice − cost`; `marginPct = margin / cost` si `cost > 0`. Solo admin + Excel; no ecommerce/Orders. Brief: `docs/stages/S4/02-product-cost-margin.md` |
| 37 | Logging server (consola) | ✅ | Observabilidad v1 = **solo stdout/stderr** vía **`@de-tin-marin/logging`** (JSON una línea). `createServerErrorHelpers({ app, includeUnexpectedMessage })` en shims de app. `guardAction` / `withOperation` + `logServerError` / `Info` / `Warn` + `safeMeta` (redact PII/secrets). Metadata = resumen (IDs, conteos, códigos); nunca payloads crudos. Admin puede devolver `message` en `UNEXPECTED`; ecommerce no. Detalle: `rules/40-validation-and-boundaries.md` · `packages/logging/README.md` |
| 38 | Contacto y cobro público dinámico | ✅ | Singleton `core.public_business_settings`: WhatsApp/email + instrucciones Yape/transferencia. Staff actualiza; `SELECT` público deliberado para storefront. Ecommerce usa DTO allowlist validado, no valores hardcodeados. Las instrucciones de órdenes `pending_payment` se leen al visualizarse, no se congelan en `orders` ni confirman pagos. Migración `00026`; Regla 27 |
| 39 | Notificación de orden creada | ✅ | `@de-tin-marin/notifications` usa Nodemailer SMTP server-only. Tras persistir, create-order **await** `scheduleOrderCreatedNotification` (sin `after()`): el request espera el envío; fallo/SMTP ausente **no** altera la orden. Puerto de transporte **587**, `secure: false`, `family: 4`, timeouts 60s. Ecommerce → cliente + admin; admin → solo admin. Admin desde #38 + extras env. Plantillas HTML embebidas en `*.template.ts` (no `readFileSync`). Sin outbox/reintentos/webhooks v1. Regla 28 / S4-06 |
| 40 | Puntos de recojo vs recojo en tienda | ✅ | **`pickup`** = recojo en tienda (admin manual; sin ubicación). **`pickup_point`** = catálogo `pricing.pickup_points` (nombre + coords + fee configurable). Ecommerce guest solo `delivery` \| `pickup_point`. Snapshot `fulfillment.pickupPoint` al crear orden. Migración `00028`. Brief: S4-08 |
| 41  | Cancelación atómica (refund + restock) | ✅     | Cancelar orden es el único punto de entrada. `pending_payment` → solo `cancelled`. Post-pago (`paid`/`preparing`/`ready`): RPC `commerce.cancel_order_with_restock` atómica (payments → `refunded` + `restock_stock_for_order` + `cancelled`). Idempotente si ya `cancelled`. Sin reembolso suelto de payment. Migración `00029`. Regla 18. Brief: S4-09 |

## Docs sincronizados (2026-08-22 — cancelación atómica)

- DECISIONS **#41** — cancel = único entrypoint; post-pago refund + restock
  atómicos; `refundPayment` → `USE_CANCEL_ORDER`
- Migración `00029_cancel_order_with_restock.sql` —
  `restock_stock_for_order` + `cancel_order_with_restock` (staff, idempotente)
- Regla **18** reescrita (ya no restock manual)
- Docs: `inventory.md`, `orders.md`, `database.md` RPCs, README admin orders
- Brief [`stages/S4/09-cancel-atomic-restock.md`](stages/S4/09-cancel-atomic-restock.md)
  + roadmap S4-09 ✅
- Cross-refs S2A / S2B / S2C (Regla 18 histórica → ver #41)

## Docs sincronizados (2026-08-22 — checkout UX validación form)

- Sin decisión #N nueva: polish UX del checkout guest (no cambia contrato
  de create-order ni cobertura).
- Form: validación **on blur** por campo (ya existía); botón “Confirmar
  pedido” solo se deshabilita en `isSubmitting` (no por `covered` /
  fee loading / pricing).
- Al submit inválido: schema Zod → scroll/focus al primer campo + toast
  Sonner con campo y sección; fuera de cobertura / pendientes → toast.
- Docs: README `apps/ecommerce/.../checkout`, brief S3A-3 (quita “submit
  disabled”), bullet roadmap S3A-3.

## Docs sincronizados (2026-08-22 — SMTP await / puerto 587)

- DECISIONS #39 — se retira `after()`: create-order **await** el envío SMTP
  best-effort; fallo no revierte la orden (puede alargar latencia del
  checkout/create admin).
- Transporte: puerto **587** fijo en mailer/helpers, `secure: false`,
  `family: 4`, timeouts 60s; log `notify_start` al iniciar.
- Docs: Regla 28, `orders.md`, roadmap S4-06, brief S4-06 (notas post),
  `architecture.md`, `rules/40`, READMEs package / ecommerce / checkout /
  admin orders.

## Docs sincronizados (2026-08-22 — flujo de documentación)

- Guía canónica [`docs/DOC-WORKFLOW.md`](DOC-WORKFLOW.md): capas, precedencia,
  checklist al documentar features, anatomía de Regla / brief / sync.
- Regla Cursor siempre activa: `.cursor/rules/doc-workflow.mdc` — al pedir
  documentar, leer DOC-WORKFLOW antes de editar.
- Enlaces en `docs/README.md`, `AGENTS.md` §14, `CLAUDE.md` convenciones.

## Docs sincronizados (2026-08-19 — puntos de recojo)

- DECISIONS #40 — `pickup` (tienda, admin) ≠ `pickup_point` (catálogo
  `pricing.pickup_points` con coords + fee). Guest solo `delivery` |
  `pickup_point`.
- Migración `00028_pickup_points.sql`: tabla + `pickup_points_enabled` +
  `insert_guest_order` XOR (dirección vs snapshot; guest no `pickup`).
- Checkout: lista puntos activos (vacía si kill switch off); create
  rehidrata snapshot desde DB y exige fee server-side.
- Admin `/delivery` pestaña Puntos de recojo; order-form los tres métodos.
- Shared `resolveCheckoutFulfillmentFee` / `resolvePickupPointFee`.
- Docs: S4-08, Reglas 19/30, `database.md`, `orders.md`, READMEs delivery y
  checkout.

## Docs sincronizados (2026-08-18 — imagen Nosotros)

- DECISIONS #35 — folder S3 `about` + validación landscape ~16:9 (±5 %), ancho ≥800 px
- Admin `/web-customization`: pestañas **Inicio** (hero) y **Nosotros** (singleton)
- `core.about_page_settings` — `image_url` nullable; `null` → placeholder ecommerce
- Migración `00027_about_page_settings.sql` + pgTAP
- Ecommerce: `AboutPageContainer` SSR + `resolveAboutStoryImageUrl` (fallback obligatorio)
- Validación: `@de-tin-marin/validations/about-page`
- Docs: S4-07, S4-03 (cross-ref), S0-03, `database.md`, `infra.md`, Regla 29,
  READMEs `web-customization` (admin) y `about` (ecommerce)

## Docs sincronizados (2026-08-17 — plantillas email embebidas / build Vercel)

- Causa: `readFileSync` de `order-*.html` al cargar el módulo. En Vercel esos
  archivos no van en el serverless bundle → `ENOENT`. El crash al importar
  `@de-tin-marin/notifications` también rompía `/checkout` (distritos).
- Fix: HTML en `*.template.ts`; se quitó `outputFileTracingIncludes` de
  `next.config` (parche frágil, no necesario si el asset viaja con webpack).
- Regla general: assets runtime de packages = módulos importables; no asumir
  que `fs` + path relativo funciona en prod solo porque funciona en local.
  Documentado en `coding-guidelines.md`, `rules/95`, trampas `CLAUDE.md`,
  README del package y brief S4-06.

## Docs sincronizados (2026-08-16 — notificaciones de orden)

- `@de-tin-marin/notifications` concentra configuración SMTP, destinatarios,
  mapper del snapshot y plantillas HTML/texto. Es server-only; sus secretos
  viven exclusivamente en `SMTP_*` de cada app.
- Tras insertar la orden, ecommerce y admin invocan un helper que agenda el
  trabajo con `after()`. El envío no bloquea la respuesta ni forma parte de la
  transacción: una falla no revierte la orden.
- Matriz: ecommerce → contacto + admin/extras; admin → admin/extras, nunca el
  contacto. Extras se validan y deduplican case-insensitivamente.
- Logs de scheduling incluyen IDs, origen, conteo y código; excluyen PII,
  carrito, dirección y credenciales. Links absolutos son opcionales; el link
  guest contiene `orderNumber` + email y solo se construye con base URL
  server-side configurada.
- Docs: `orders.md`, Regla 28, arquitectura, S2C/S3A-04, roadmap, S4-06 y
  READMEs de checkout/admin orders/paquete.

## Docs sincronizados (2026-08-16 — contacto y pagos dinámicos)

- Nueva fuente única: `core.public_business_settings` (singleton `default`),
  con WhatsApp E.164, email, Yape/titular y banco/titular/cuenta/CCI.
  Migración `00026` inserta la fila inicial, valida formato y habilita RLS:
  lectura pública; actualización solo `core.is_staff()`.
- Admin `/business-settings` actualiza con `requireStaff` y
  `businessSettingsSchema`; no crea/elimina filas.
- Ecommerce recibe `PublicBusinessSettings` como DTO allowlist validado:
  Help FAB, Nosotros, Términos, Privacidad y las instrucciones de órdenes
  guest `pending_payment`. Query key pública y `staleTime` de cinco minutos.
- Instrucciones visibles ≠ pago confirmado: no escriben `payments`, no cambian
  `payment_status`, no descuentan stock y no se incluyen en el snapshot de
  una orden.
- Docs: `database.md`, `orders.md`, Regla 17/27, S3A-04, roadmap y READMEs de
  los módulos admin/ecommerce.

## Docs sincronizados (2026-08-15 — cantidad de sorpresa ecommerce)

- `bundles.quantity` = cantidad de **sorpresas** de la plantilla (default).
  En orden: `shopping_cart` `line.quantity` = sorpresas pedidas (puede
  diferir del default de plantilla tras personalizar).
- Wizard ecommerce/guest: `15 ≤ line.quantity ≤ 100`; init =
  `clampBundleLineQuantity(bundles.quantity)` (DTO `personCount` es ese
  valor; nombre legacy). Preview fresco al cambiar; congela al añadir al
  carrito.
- `createGuestOrderInputSchema` revalida el rango; admin order-form
  `quantity >= 1` sin tope 15–100.
- La cantidad multiplica precio de línea, `totalQuantity` de componentes y
  envases. Independiente de min/max de productos distintos.
- Docs: Regla 7, `orders.md`, `database.md`, S3A-2/S3A-3, roadmap, READMEs.

## Docs sincronizados (2026-08-15 — límites configurables de sorpresa)

- `catalog.bundles.customization_min_products` /
  `customization_max_products`, migración `00025`: defaults y backfill
  **8/20**; DB garantiza `1 ≤ min ≤ max`; app/Zod impone techo absoluto
  **100**.
- Son límites de productos **distintos** por plantilla, no límites globales ni
  de compra: la composición base, wizard ecommerce, preview admin y
  create/preview de orden los validan.
- Contrato shared:
  `resolveBundleCustomizationBounds` +
  `validateBundleCustomization`; IDs únicos y cantidades positivas.
- Una orden mantiene su snapshot `shopping_cart`; cambios posteriores de
  plantilla/límites no reescriben el pedido histórico.
- Docs: `database.md`, Reglas 6–7, `orders.md`, S3A-2, roadmap, READMEs
  catalog admin / orders admin / bundle-wizard.

## Docs sincronizados (2026-08-08 — órdenes: dual product + surcharge)

Canónico detallado: [`orders.md`](orders.md) · README [`apps/admin/src/modules/orders/README.md`](../apps/admin/src/modules/orders/README.md).

- **DECISIONS #27:** líneas product `packageQuantity`/`unitQuantity` + `packagePrice`/`unitPrice`; `normalizeProductLineQuantities` por ipp; admin vende sueltas (`clampProductDualQuantities`); ecommerce/guest `unitQuantity = 0`
- **`surcharge_total`:** `total = subtotal − discount + shipping + surcharge`; admin tabs Precio final (XOR vía `deriveAdjustmentsFromFinalPrice`) y Descuento/recargo (pueden coexistir); guest surcharge=0
- Migraciones `00023_order_surcharge_total.sql`, `00024_product_line_dual_quantity.sql`
- Reglas 4 (nota), **15** (demanda dual + normalize), **16** (cabecera), **21** (admin dual / ecommerce solo pkg)
- `inventory.md` agregación; `pricing.md` lineTotal dual; cart README ecommerce; S2B nota evoluciones
- Zod `@de-tin-marin/validations/order`: dual qty + `surchargeTotal`; shared `order-cart` / `product-purchase-limits`

## Docs sincronizados (2026-08-07 — admin salta min/max compra)

- Regla 21 / 25 + DECISIONS #31/#33: min/max solo ecommerce; admin order-form qty ≥ 1 acotada por stock/`availableQuantity`
- Shared `resolveProductPurchaseBounds({ mode: "admin" | "customer" })`; `listPackStockShortages`
- `PackListItem`: `availableQuantity` + `stockShortages` (admin list/page)
- Order-form: producto y pack sin clamp a purchase min/max; `resolvePackAddBlockReason` + i18n shortages
- Docs: `business-rules`, `inventory`, S1F, catalog/orders READMEs

## Docs sincronizados (2026-08-07 — order-form picker + BundleFormItemDTO)

- `getBundle` / `BundleFormItemDTO`: sku, imageUrl, netPrice, isActive, productType, itemsPerPackage, stockTotalBaseUnits
- Order-form: tabs + `ProductSearchPicker`; plantilla sorpresa filtra `isActive`; composición pack/bundle en líneas; bloqueo `OUT_OF_STOCK` al add producto
- Docs: S1B, catalog/orders READMEs, Regla 21 (admin OUT_OF_STOCK), `85-react-components.md`

## Docs sincronizados (2026-08-07 — ProductSearchPicker UX)

- Picker: `pageSize = ADMIN_DEFAULT_PAGE_SIZE`, scroll infinito (IntersectionObserver), auto-page si excludeIds vacía la vista
- Meta fila: `unitNetPrice` + `shouldShowItemsPerPackage`; i18n `formatUnitPrice` / `formatItemsPerPackage`
- Docs: catalog README, `50-data-fetching-cache-ssr.md`, S3B, `85-react-components.md`

## Docs sincronizados (2026-08-07 — SSR listados + ProductSearchPicker + pageSize 5)

- Home ecommerce: `loadStorefrontCatalog` + `HydrationBoundary` (DECISIONS #32 cumplido en `/`)
- Admin listados: SSR prefetch + `createAdminQueryClient` + `HydrationBoundary`
- `ADMIN_DEFAULT_PAGE_SIZE = 5`; UI composition vía `ProductSearchPicker` + `listProductsPageAction` (eliminado `listProductsAction` de UI)
- Dashboard: `getDashboardSummaryService` (counts / recent / low-stock) sin listados completos
- Docs: `50-data-fetching-cache-ssr.md`, `85-react-components.md`, `88-ui-design-i18n.md`, S3B, S1A/S1B/S1D/S1F, Reglas 6/23, READMEs catalog/orders/ecommerce catalog

## Docs sincronizados (2026-08-07 — GranularNumberInput / number drafts)

- Admin forms: `GranularNumberInput` + `number-draft.helpers` (product, pack, bundle, category, container, delivery, order-form)
- `docs/coding-guidelines.md` § Inputs numéricos controlados
- `docs/rules/85-react-components.md` § Inputs numéricos (admin)

## Docs sincronizados (2026-08-05 — Vitest Node 25 + unit ceil + pre-commit test)

- `pnpm test` / `test:watch`: `NODE_OPTIONS=--no-webstorage`; jsdom `url`; `vitest.setup.ts` memory `localStorage`
- Husky pre-commit: `lint-staged` + `pnpm test`
- Regla 2 / DECISIONS #28 / `database.md` / `pricing.md` / S1D — ceil de `unit` y coherencia `unit×ipp ≥ normal`
- `docs/rules/95-guardrails-lint-ci.md`, `docs/coding-guidelines.md`

## Docs sincronizados (2026-08-05 — pack dual quantities package + unit)

- DECISIONS #33 — `package_quantity` + `unit_quantity` en `pack_items`; reference/deduct dual
- `docs/stages/S4/04-pack-dual-quantities.md`
- `business-rules.md` — Reglas 15, 22–24
- `database.md`, `orders.md`, `pricing.md`, `inventory.md`, `architecture.md`, `roadmap.md`, `docs/README.md`
- Briefs satélite: S1F (nota post-S4-04), S4-01 Excel columnas dual
- READMEs: admin catalog, ecommerce catalog
- Código: migración `00022`, `pack-price`, `pack-availability`, order-cart pack, deduct pack branch

## Docs sincronizados (2026-08-04 — listProducts status + wizard description)

- `listProductsAction` / repo / service: filtro opcional `{ status: "all"|"active"|"inactive" }` (`adminStatusFilterSchema`)
- Pack/bundle forms: picker con `status: "active"`; flag `SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH` (off); merge de opciones al editar
- Wizard ecommerce: `bundleWizardTemplateSchema.description` + UI
- Docs: Regla 6 / 23, READMEs catalog + bundle-wizard, briefs S1A / S1D / S1B / S1F / S3A-2

## Docs sincronizados (2026-07-28 — catalog_version + Broadcast + funnel)

- DECISIONS #32 — Infinity + Broadcast; carrito sync al montar; checkout validate al submit
- Migraciones `00017_catalog_cache_meta.sql`, `00018_catalog_version_broadcast.sql`
- `docs/rules/50-data-fetching-cache-ssr.md`, `00-architecture.md`, `85-react-components.md`
- `docs/database.md` — `catalog_cache_meta` + `bump_catalog_version`
- READMEs ecommerce catalog/cart/checkout + admin catalog/orders
- `@de-tin-marin/shared/catalog-version` — topic/event
- Gate: `useCatalogVersionGate` (Broadcast + visibility safety; sin poll)

## Docs sincronizados (2026-07-02)

- `database.md`
- `business-rules.md`
- `pricing.md`
- `campaigns.md`
- `inventory.md`
- `orders.md`
- `roadmap.md`

## Docs sincronizados (2026-07-02 — rename)

- Todos los `.md` del repo: `candy` → `de-tin-marin`, `@candy/*` → `@de-tin-marin/*`, marca **De Tin Marín**

## Docs sincronizados (2026-07-03 — S1A errores + grants)

- `rules/40-validation-and-boundaries.md` — sección de manejo de errores y logging
- `supabase/README.md` — nota de grants + migración `00003_api_grants.sql`

## Docs sincronizados (2026-07-03 — S1B modelo de bundles)

- `database.md` — `catalog.bundles` gana `image_url` y `quantity`, pierde `prices` (precio dinámico); `bundle_items.quantity` → `units_per_person`
- `docs/stages/S1B/01-bundles.md` — brief con modelo de precio dinámico
- DECISIONS #6 reescrita; #22 nueva (modelo de bundles)

## Docs sincronizados (2026-07-03 — i18n)

- DECISIONS #23 nueva (i18n con `next-intl`, default `es`)
- `@de-tin-marin/config/i18n` — `locales`, `defaultLocale`, `Locale`, `isLocale`
- `apps/ecommerce` y `apps/admin`: `src/i18n/request.ts`, `messages/es.json`, `next.config.ts` con `createNextIntlPlugin`, layout con `NextIntlClientProvider`, `src/global.d.ts` (tipado de mensajes)

## Docs sincronizados (2026-07-03 — S1C campañas fundación)

- `docs/stages/S1C/01-pricing-campaigns-foundation.md` — brief fundación sin uso operativo v1
- `campaigns.md`, `pricing.md` — acotación v1
- DECISIONS #24 (campañas dormidas en v1)

## Docs sincronizados (2026-07-03 — stock deduct timing)

- `roadmap.md` — orden S2B → S2C → S2A; S3 depende de S2A
- `orders.md`, `inventory.md`, `database.md` — deduct fuera de S2B/S2C
- DECISIONS #25 (deduct al `paid`, implementación en S2A post-S2C)

## Docs sincronizados (2026-07-03 — order shopping cart)

- `orders.md` — estados sin draft/shipped; cabecera + `shopping_cart` JSONB
- `database.md`, `business-rules.md`, `inventory.md`, `pricing.md`, `architecture.md`, `roadmap.md`
- DECISIONS #17 actualizada; #26 nueva (sin tablas de líneas)

## Docs sincronizados (2026-07-06 — S1D presentaciones + stock)

- `docs/stages/S1D/01-products-packages-stock.md` — brief refactor catálogo
- `database.md` — `product_type`, `items_per_package`, `prices.unit`, stock sealed/loose
- `business-rules.md` — Reglas 2, 4, 8, 9, 15
- `pricing.md`, `inventory.md`, `roadmap.md`
- DECISIONS #13, #15, #25 actualizadas; #27, #28, #29, #30 nuevas

## Docs sincronizados (2026-07-09 — SSR, caché y data fetching)

- DECISIONS #32 nueva (SSR vs CSR, 15 min catálogo, fresco en funnel de compra)
- `docs/rules/50-data-fetching-cache-ssr.md` — reglas de fetching, query keys, anti-patrones
- `docs/rules/00-architecture.md` — sección fetching y caché
- `docs/rules/85-react-components.md` — SSR vs RQ en containers
- `apps/ecommerce/src/modules/catalog/README.md` — matriz SSR/CSR por ruta
- `apps/ecommerce/src/modules/cart/README.md` — patrón RQ fresco
- `apps/admin/src/modules/orders/README.md` — preview y actions
- `apps/ecommerce` y `apps/admin`: `query-cache.ts`, `QueryProvider` con defaults 15 min

## Docs sincronizados (2026-07-28 — stock unit vs package + presentaciones)

- DECISIONS #27, #29 — `unit` solo loose; líneas product en presentaciones
- `business-rules.md` — Reglas 4, 15, 21
- `inventory.md`, `database.md`, `orders.md`
- `docs/stages/S2A/01-stock-deduct-on-payment.md` — algoritmo + helpers
- `docs/stages/S1D/01-products-packages-stock.md` — nota supersede OUT `unit`
- Código: `product-stock` (`deductProductStock`, …), `checkOrderStock`, migración `00014`

## Docs sincronizados (2026-07-28 — packs / combos S1F + S3A-05)

- DECISIONS #33 — packs BOM fija, reference/normal, deduct presentaciones
- `docs/stages/S1F/01-catalog-packs.md`, `docs/stages/S3A/05-catalog-packs-ecommerce.md`
- `business-rules.md` — Reglas 15 (pack), 22–25
- `database.md`, `orders.md`, `pricing.md`, `inventory.md`, `campaigns.md`, `architecture.md`, `roadmap.md`
- `CLAUDE.md` — dominio Packs
- READMEs admin catalog/orders + ecommerce cart/catalog
- Código: migración `00016`, `pack-price`, order-cart `type: pack`, admin/ecommerce combos

## Docs sincronizados (2026-07-28 — infra media CDN)

- DECISIONS #34 — S3 + CloudFront vía CDK en `infra/cdk/`
- `docs/stages/S0/02-infra-media-cdn.md`
- `infra/cdk/README.md`

## Docs sincronizados (2026-07-28 — pack image upload)

- DECISIONS #35 — presign (inicialmente packs; ampliado 2026-07-29 a todo catálogo)
- `docs/stages/S0/03-admin-pack-image-upload.md`
- Admin: `modules/media/`, pack-form upload UI, env AWS/media

## Docs sincronizados (2026-07-29 — infra staging + production)

- `docs/infra.md` — doc canónica media CDN (reglas, stacks, deploy)
- `MediaProduction` en `infra/cdk/bin/app.ts`
- Scripts `infra:deploy:staging` / `infra:deploy:production`
- `docs/README.md`, `architecture.md`, DECISIONS #34

## Docs sincronizados (2026-07-29 — upload catálogo completo)

- DECISIONS #35 — presign en packs · products · bundles · containers
- `docs/stages/S0/03-admin-pack-image-upload.md` — scope ampliado; estado done
- `docs/infra.md` — fuera de scope sin “otro brief” para forms
- `docs/database.md` — `image_url` = URL CDN (texto)
- `docs/roadmap.md` § S0 media
- READMEs admin catalog

## Docs sincronizados (2026-07-30 — S4-01 export Excel catálogo)

- `docs/stages/S4/01-catalog-status-excel.md` — brief done
- `docs/roadmap.md` § S4-01
- `business-rules.md` Regla 22 — helper `pack-availability`
- `inventory.md`, `architecture.md` (Reports)
- `apps/admin/src/modules/reports/README.md`
- Código: ExcelJS workbook, `exportCatalogStatusAction`, shared `pack-availability`

## Docs sincronizados (2026-07-30 — S4-02 costo / margen producto)

- DECISIONS #36 — `cost_net_price` + margen derivado
- `docs/stages/S4/02-product-cost-margin.md`
- `business-rules.md` Regla 26 · `pricing.md` · `database.md` · `roadmap.md` § S4-02
- Excel Productos + admin form/list; shared `product-margin`

## Docs sincronizados (2026-07-31 — S4-03 hero web customization)

- DECISIONS #35 — folder S3 `hero` + validación aspecto cuadrado 1:1
- `docs/stages/S4/03-hero-web-customization.md`
- `docs/database.md` — `core.hero_settings` + `core.hero_images`
- `docs/roadmap.md` § S4-03 · `docs/infra.md` folder hero
- Migración `00020_hero_web_customization.sql`
- Admin `/web-customization` · ecommerce `getPublicHeroConfig` + hero carousel/static + fallback

## Docs sincronizados (2026-07-31 — S3A-1-R paginación catálogo público)

- Migración `00021_list_public_catalog_rpcs.sql` — `list_public_bundles` / `list_public_packs` + `campaigns_select_public`
- `docs/stages/S3A/01-remediation-catalog-pagination-sql.md` — cerrado
- `docs/database.md` · `docs/campaigns.md` · README ecommerce catalog
- Productos: PostgREST count + range (sin RPC)

## Docs sincronizados (2026-07-31 — S3B paginación listados admin)

- `docs/stages/S3B/01-admin-list-pagination.md`
- `docs/roadmap.md` § S3B · `docs/rules/50-data-fetching-cache-ssr.md`
- READMEs admin catalog/orders · `@de-tin-marin/validations/admin-list`

## Docs sincronizados (2026-08-15 — logging consola server)

- DECISIONS #20 (actualizado) · **#37** — observabilidad v1 = stdout/stderr JSON
- Package **`@de-tin-marin/logging`**: `createLogger`, `safeMeta`, `guardAction` /
  `withOperation`, `createServerErrorHelpers`
- Shims: `apps/*/src/shared/errors/server-error.ts` (`admin` con
  `includeUnexpectedMessage: true`; `ecommerce` con `false`)
- Mutaciones críticas (orden, pago, guest checkout, media, catalog bump) loguean
  en service además del wrapper de action
- Docs: `rules/40-validation-and-boundaries.md`, `coding-guidelines.md`,
  `architecture.md`, `packages/logging/README.md`, READMEs ecommerce / S3A-0


## Cómo añadir una decisión

1. Agregar fila con estado `⏳ Abierto` o `✅` resuelta.
2. Actualizar docs referenciados.
3. Mencionar en el PR qué docs se sincronizaron.

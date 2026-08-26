# Reglas de negocio — De Tin Marín

> Ledger global. Reglas **v2** marcadas como futuras. Decisiones firmadas en [`DECISIONS.md`](DECISIONS.md) (2026-07-02).

---

## Products

### Regla 1 — SKU único

- **Trigger:** Crear o actualizar producto.
- **Pasos:** `sku` único entre productos activos (`deleted_at IS NULL`).
- **Fallo:** Rechazar.

### Regla 2 — Estructura de precios válida

- **Trigger:** Guardar producto.
- **Pasos:**
  1. `prices.normal` y `prices.unit` deben existir, cada uno con `netPrice >= 0`, `igv >= 0`, `subtotal >= 0`, y `subtotal + igv = netPrice` (tolerancia centavos).
  2. Coherencia con presentación (`pricesSchemaWithCoherence`):
     - `|unit.netPrice × items_per_package − normal.netPrice| ≤ 0.01`, **o**
     - `unit.netPrice × items_per_package > normal.netPrice` (permitido tras redondeo hacia arriba).
  3. Si `items_per_package = 1`, `normal` y `unit` deben ser idénticos.
- **Cálculo de `unit`:** `buildPricesFromPackageNetPrice` hace `ceil` a 2 decimales de `normal / items_per_package` — la unidad suelta no puede salir más barata que el paquete (p. ej. S/ 1 ÷ 12 → `unit.netPrice = 0.09`).
- **Fallo:** Rechazar validación si `unit × ipp` es **menor** que `normal` fuera de tolerancia (no si es mayor por el ceil).
- **Nota:** `normal.netPrice` = precio de la presentación (tira/paquete); `unit.netPrice` = precio por unidad base (bolsa). El backend calcula `unit` al guardar — no editar ambos de forma independiente.

### Regla 3 — Producto inactivo no vendible

- **Trigger:** Carrito / checkout / composición de bundle.
- **Pasos:** Rechazar si `is_active = false` o `deleted_at IS NOT NULL`.
- **Fallo:** "Producto no disponible".

### Regla 4 — Stock en producto (v1)

- **Trigger:** Consultar disponibilidad / confirmar orden / ajuste admin.
- **Pasos:**
  1. Fuente de verdad: `product_type` + `stock_sealed_packages` + `stock_loose_base_units` + `items_per_package`.
  2. Disponibilidad vendible según tipo:
     - `product_type = 'package'`: `totalBaseUnits = sealed × items_per_package + loose` (se pueden abrir paquetes).
     - `product_type = 'unit'`: solo `stock_loose_base_units` (los `stock_sealed_packages` **no** se abren ni cuentan como vendibles hasta pasarlos a loose en admin).
  3. Tras cada movimiento en `package`, normalizar: si `loose >= items_per_package`, convertir excedente a paquetes cerrados. En `unit` no se normaliza sealed↔loose automáticamente.
  4. Display: `"X {package_label} + Y bolsas"` derivado de sealed/loose (o `"N u."` si `items_per_package = 1`).
- **Fallo:** Si stock insuficiente al pagar → Regla 15 revierte.
- **Nota:** Líneas `type: product` congelan `packageQuantity` (presentaciones) + `unitQuantity` (unidades base; admin; ecommerce `0`) y precios `packagePrice`/`unitPrice`. Componentes de pack usan **presentaciones** (`totalPackages`) y **unidades** (`totalUnits`). Componentes de bundle usan **unidad base** (`totalQuantity`).

---

## Bundles (sorpresas)

### Regla 5 — Plantilla sin stock

- **Trigger:** Cualquier operación sobre bundle.
- **Pasos:** Los bundles **no tienen** `stock_quantity`. Se arman **por demanda** al crear la orden.
- **Fallo:** N/A.

### Regla 6 — Composición base de plantilla

- **Trigger:** Crear/editar bundle en admin.
- **Pasos:** `bundle_items` referencia productos existentes y activos; al menos un item; **`container_id`** apunta a envase activo en `catalog.surprise_containers`. Configurar **`customization_min_products`** / **`customization_max_products`** (default 8/20; `1 ≤ min ≤ max ≤ 100`). La composición base debe cumplir `min ≤ |items| ≤ max`.
- **UI admin (picker):** `ProductSearchPicker` → `listProductsPageAction` con `status: "active"` (búsqueda paginada). Al editar, ítems ya guardados en la plantilla se muestran aunque el producto esté inactivo (`mergeBundleProductOptions`). Switch “incluir inactivos” detrás de flag `SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH` (hoy `false`); habilitarlo sin relajar la validación de write falla con `PRODUCT_NOT_FOUND`.
- **Persistencia:** create/update rechazan productos inactivos (`getActiveProductsByIdsRepo`) y composiciones fuera del rango de personalización.
- **Fallo:** Rechazar bundle vacío, productos inválidos, envase inactivo o ítems fuera de min/max.

### Regla 7 — Personalización en la orden

- **Trigger:** Cliente crea/edita una sorpresa en el pedido.
- **Pasos:**
  1. Partir de plantilla `bundle_items`; permitir agregar, quitar o
     **reemplazar** productos respetando los límites **de esa plantilla**
     (`customization_min_products` / `customization_max_products`).
  2. `bundles.quantity` = cantidad de **sorpresas** de la plantilla. En
     ecommerce / guest, `line.quantity` (sorpresas pedidas) es editable con
     **15 ≤ quantity ≤ 100** (init = `clamp(bundles.quantity, 15, 100)`).
     Admin order-form permite `quantity >= 1` sin ese tope.
  3. Unidades por dulce **por sorpresa**:
     `bundle_items.units_per_person` = default de plantilla (admin ≥ 1).
     Con `storeFeatures.enableUnitsPerPerson = true`, el wizard ecommerce
     edita `quantityPerUnit` (≥ 1; init desde plantilla). Flag off →
     `quantityPerUnit = 1`. Congelar
     `totalQuantity = quantityPerUnit × line.quantity` en el snapshot.
  4. Persistir snapshot en `orders.shopping_cart` (línea `type: bundle`,
     independiente de la plantilla). Revalidar min/max de componentes y
     cantidad (ecommerce) en preview y al crear la orden.
- **Fallo:** Rechazar productos inactivos, `quantityPerUnit <= 0`,
  cardinalidad de componentes fuera del rango de la plantilla, o
  (ecommerce/guest) `quantity` fuera de 15–100.

### Regla 8 — Precio de sorpresa en orden

- **Trigger:** Calcular total de línea bundle.
- **Pasos:**

```text
line_total =
  Σ (total_quantity × unit_price_final_producto)   // finalUnitPrice; campaña ya aplicada
  + containerUnitPrice × line.quantity             // 1 envase por sorpresa, congelado
```

- `unit_price_final_producto` = `computeFinalPrice(normal.netPrice, campaign) / items_per_package`, o `prices.unit.netPrice` sin campaña.
- `containerUnitPrice` = `surprise_containers.prices.netPrice` al crear la orden; congelado en `shopping_cart` como `container.unitPrice`.
- `units_per_person` y `total_quantity` en **unidades base** (bolsas).

**Plantilla (preview admin):**

```text
total = bundle.quantity × (containerNetPrice + itemsSubtotalPerSorpresa)
```

- **Compat legacy:** órdenes pre-S1E con `serviceFee` en `shopping_cart` (sin `container`) no se recalculan — Regla 16.
- **Fallo:** N/A.

---

## Pricing y campañas

### Regla 9 — Precio final en backend (productos)

- **Trigger:** Listar productos (ecommerce o admin).
- **Pasos:**
  1. Leer `prices.normal` (presentación) y `prices.unit` (unidad base).
  2. Si `campaign_id` apunta a campaña **vigente** (`starts_at <= now <= ends_at`, `is_active`):
     - `finalPrice = netPrice × (1 - percentage/100)` sobre `normal.netPrice`
     - `finalUnitPrice = finalPrice / items_per_package`
     - Incluir desglose IGV proporcional si el front lo necesita.
  3. Si no hay campaña o expiró → `finalPrice = normal.netPrice`; `finalUnitPrice = unit.netPrice`.
- **Fallo:** El **frontend no recalcula** — usa `finalPrice` del backend.
- **Tests:** Vitest + query integration.

### Regla 10 — Relación 1:1 producto-campaña

- **Trigger:** Asignar campaña a producto en admin.
- **Pasos:** Actualizar `products.campaign_id`. Si el producto ya tenía otra campaña, **reemplazar** (solo una relación activa).
- **Fallo:** N/A.

### Regla 11 — Vigencia de campaña

- **Trigger:** Calcular precio final.
- **Pasos:** Campaña fuera de fechas o `is_active = false` → ignorar; usar `prices.normal` sin descuento.
- **Fallo:** No error al usuario — precio normal.

### Regla 12 — Un solo motor de precio en listados

- **Trigger:** Cualquier precio mostrado de producto suelto.
- **Pasos:** Solo el backend (query/service de catálogo) calcula. Orders **nunca** recalcula post-checkout.
- **Fallo:** Bug de arquitectura.

---

## Orders

### Regla 13 — Congelar al confirmar orden

- **Trigger:** Orden pasa a `pending_payment`.
- **Pasos:** Persistir `shopping_cart` (líneas producto y bundle con precios congelados). Guardar `pricing_snapshot` y totales en `orders`.
- **Fallo:** Rechazar transición sin snapshot.

### Regla 14 — Transiciones de estado válidas

- **Trigger:** Cambiar `orders.status` (admin transition).
- **Pasos:**
  1. Solo aristas de [`orders.md`](orders.md) /
     `canTransitionOrderStatus(from, to, method)` (shared).
  2. Tras `ready`, el destino logístico **depende de**
     `fulfillment.method` (DECISIONS **#42** / S4-10; courier: **#43**):
     - `pickup` → `awaiting_pickup` (sin shipment)
     - `delivery` \| `pickup_point` \| `courier` → `in_transit`
       (**exige** carrier + tracking en `commerce.shipments` en la misma
       mutation; si falla el upsert, la orden no cambia)
  3. `delivered` = el cliente **ya tiene** el producto (solo desde
     `awaiting_pickup` \| `in_transit`).
  4. Cancel: Regla 18 (incluye `awaiting_pickup` / `in_transit`).
- **Fallo:** rechazar transición ilegal o `in_transit` sin shipment.

### Regla 15 — Descuento de stock al pagar (v1)

- **Trigger:** Operador confirma pago → orden `paid` (Regla 17).
- **Precondición snapshot:** al crear/preview, líneas `type: product` ya pasaron por `normalizeProductLineQuantities` (si `unitQuantity >= items_per_package` → convierte a `packageQuantity`). El JSONB congelado es la fuente de verdad del deduct.
- **Pasos (transacción atómica — `commerce.deduct_stock_for_order` / `confirm_payment_with_stock_deduct`):**
  1. Agregar demandas por `product_id`:
     - Líneas `type: product`: `presentationQuantity += packageQuantity`; `baseUnits += unitQuantity` (DECISIONS #27). Ecommerce/guest suelen traer `unitQuantity = 0`; admin puede aportar ambos.
     - Componentes de líneas `type: pack`: `presentationQuantity += totalPackages` (`packageQuantity × line.quantity`) y `baseUnits += totalUnits` (`unitQuantity × line.quantity`; legacy sin campo → 0) — Regla 24.
     - Componentes de líneas `type: bundle`: `baseUnits += totalQuantity` (unidad base).
  2. Por producto, `need` en unidades base:
     - `need = presentationQuantity × items_per_package + baseUnits` (con `items_per_package >= 1`).
     - Equivale a sumar `packageQuantity × ipp + unitQuantity` por cada línea product (más packs/bundles).
  3. Deduct según `product_type` (helpers shared: `deductProductStock` / SQL alineado):
     - **`package`:** consumir loose primero; si falta, abrir sealed y volcar sobrante a loose; normalizar (`deductBaseUnits`).
     - **`unit`:** descontar **solo** `stock_loose_base_units`; **no** tocar `stock_sealed_packages` (`deductUnitProductLoose`). Si loose < need → insuficiente aunque haya sealed.
  4. Por cada línea bundle con `container` congelado: descontar `line.quantity` de `surprise_containers.stock_quantity` (Regla 20). Líneas legacy solo con `serviceFee` → omitir envase.
  5. Si cualquier producto **o envase** queda con stock insuficiente → **ROLLBACK** completo; orden no queda `paid`.
- **Fallo:** Notificar operador; stock no mutado.
- **Tests:** Lay’s `package` 5 tiras × 10: pedido 3 presentaciones → sealed=2, loose=0; pedido admin 2 tiras + 7 bolsas → need=27; producto `unit` con sealed=50, loose=20, pedido 10 → loose=10, sealed intacto; pack con componentes dual; bundle 25 sorpresas → -25 envases; pgTAP `commerce__deduct_stock`.

### Regla 16 — Orders no recalcula precios

- **Trigger:** Post-checkout (y en create: snapshot ya es definitivo).
- **Pasos:**
  1. Usar valores congelados en `orders.shopping_cart` (`packagePrice`/`unitPrice`/`lineTotal` product; `unitPrice` pack; components bundle).
  2. Ajustes de cabecera **admin-only** (`discount_total` / `surcharge_total`) **no** recalculan precios de línea.
  3. Fórmula cabecera: `total = subtotal − discount_total + shipping_total + surcharge_total` (migración `00023`).
  4. UI admin Totales: tab Precio final deriva discount **XOR** surcharge (`deriveAdjustmentsFromFinalPrice`); tab Descuento/recargo permite ambos a la vez. Guest: ambos ajustes = 0.
- **Fallo:** Prohibido invocar recálculo de precios de línea ni mutar `shopping_cart` post-confirm.

---

## Payments (v1 manual)

### Regla 17 — Confirmación manual

- **Trigger:** Operador registra pago en admin.
- **Pasos:** Insertar/actualizar `commerce.payments` (`status = confirmed`, `confirmed_by`, `notes`) → transicionar orden a `paid` → disparar Regla 15.
- **Instrucciones al cliente:** ecommerce lee Yape/transferencia desde
  `core.public_business_settings` mientras la orden está `pending_payment`.
  Son datos de contacto/cobro públicos y dinámicos; mostrarlos **no** crea una
  fila `payments`, no confirma el pago ni reserva stock.
- **Fallo:** No confirmar `paid` sin registro en `payments`.

### Regla 18 — Cancelación atómica (refund + restock)

- **Trigger:** Operador cancela una orden (`cancelOrder` / RPC
  `commerce.cancel_order_with_restock`). Brief: S4-09 / DECISIONS #41.
- **Pasos:**
  1. Si `status = cancelled` → no-op idempotente (sin segundo restock).
  2. Si `pending_payment` → solo `status = cancelled` (no hubo deduct).
  3. Si `paid` \| `preparing` \| `ready` \| `awaiting_pickup` \| `in_transit`
     (ya hubo deduct al pagar): en **una**
     transacción:
     - payments `confirmed` → `refunded`
     - `payment_status = refunded`
     - `commerce.restock_stock_for_order` (inverso del deduct; v1 → loose +
       normalize)
     - `status = cancelled`
  4. No desde `delivered` / `completed`.
- **Admin:** único control «Cancelar». `refundPayment` responde
  `USE_CANCEL_ORDER` (no reembolso suelto).
- **Post-éxito:** si hubo restock, bump de versión de catálogo (mismo patrón
  que confirm pago).
- **NO** reembolso suelto de pago: evita payment `refunded` con orden abierta
  o restock doble.
- **Fallo:** cualquier error revierte toda la transacción.

---

## Envases de sorpresa (insumos — S1E)

### Regla 19 — Delivery configurable

- **Trigger:** Crear orden (`fulfillment.method` = `delivery` \| `pickup` \|
  `pickup_point` \| `courier`).
- **Pasos:**
  1. `delivery`: tarifa desde `pricing.delivery_zones` (`district`
     case-insensitive, `is_active`). Sin match: guest exige cobertura
     (zona **o** pin dentro del bbox Piura) y usa `fallback_fee`; fuera de
     cobertura → no crear orden.
  2. `pickup` → `shipping_total = 0` (recojo **en tienda**; **solo admin**).
  3. `pickup_point` → fee del punto **activo** (Regla 30); congelar snapshot
     en `fulfillment.pickupPoint`. XOR: no mezclar con `deliveryAddress` /
     `courier`.
  4. `courier` → **`shipping_total = 0`** siempre (flete en agencia);
     catálogo + snapshot + XOR → **Regla 31** (DECISIONS #43).
  5. Tras el fee **base** (pasos 1–4), aplicar overlay de tienda
     (`applyStorefrontShippingFee`) — **Regla 32** / DECISIONS #44. Puede
     dejar fee 0 si hay promo vigente para `delivery` / `pickup_point`;
     **no** reescribe fees en `delivery_zones` / `pickup_points`.
  6. Congelar `shipping_total` al crear. Guest revalida el fee enviado
     (`SHIPPING_FEE_MISMATCH` si no coincide con fee base + overlay;
     courier exige `=== 0`).
- **Guest ecommerce:** `delivery` \| `pickup_point` \| `courier`. Flag
  `storeFeatures.pickupEnabled` oculta recojo en tienda; **no** controla
  puntos de recojo (`pickup_points_enabled`) ni courier (`courier_enabled`).
- **Fallo:** `delivery_enabled = false` o pin/distrito fuera de Piura →
  `OUT_OF_COVERAGE`. Kill switch de puntos / courier → listado vacío /
  `covered: false`.

### Regla 20 — Stock de envases

- **Trigger:** Consultar disponibilidad / confirmar pago / ajuste admin.
- **Pasos:**
  1. Fuente de verdad: `catalog.surprise_containers.stock_quantity` (entero `>= 0`).
  2. **1 envase por sorpresa** en cada línea bundle del carrito congelado.
  3. Los envases **no** son productos vendibles; no entran como línea `type: product`.
  4. Deduct al pagar: Regla 15 paso 4 (S2A).
- **Fallo:** Stock insuficiente al pagar → Regla 15 revierte.
- **Nota:** Sin sealed/loose en envases (distinto de productos, Regla 4).

### Regla 21 — Límites min/max de compra (productos sueltos)

- **Trigger:** Agregar al carrito, editar cantidad en carrito, checkout guest (**solo ecommerce / storefront**).
- **Alcance:** Líneas `type: product`. **No** aplica a sorpresas/bundles ni wizard. Packs: ver Regla 25.
- **Shape de línea (DECISIONS #27):** `packageQuantity` + `unitQuantity` (suma ≥ 1). Ecommerce/guest **fuerzan** `unitQuantity = 0` (solo presentaciones). Admin order-form permite dual.
- **Excepción admin:** el **order-form** (`/orders/new`) **salta** `purchase_min_quantity` / `purchase_max_quantity`. Acotación: `needBase = packageQuantity × ipp + unitQuantity ≤ stockTotalBaseUnits` vía `clampProductDualQuantities` (`mode: "admin"`). **Jamás** relajar min/max en el front ecommerce ni en checkout guest.
- **Pasos (ecommerce):**
  1. Leer `purchase_min_quantity` y `purchase_max_quantity` del producto (cantidad en **presentación** = `packageQuantity`; `unitQuantity` siempre 0).
  2. `stock_presentaciones` alineado con disponibilidad vendible (Regla 4):
     - `unit` → `stock_loose_base_units` (solo sueltas).
     - `package` → `floor(totalBaseUnits / items_per_package)` con `totalBaseUnits = sealed × items_per_package + loose`.
  3. `max_efectivo = min(purchase_max_quantity, stock_presentaciones)`.
  4. Comprable solo si `stock_presentaciones >= purchase_min_quantity`.
  5. Cantidad de línea: `purchase_min_quantity <= packageQuantity <= max_efectivo` y `unitQuantity = 0`.
  6. “Añadir rápido” agrega `purchase_min_quantity` presentaciones por defecto.
- **UI admin:** `resolveProductAddBlockReason` → `OUT_OF_STOCK` solo si `availableBase = 0` (no por min de catálogo). Producto `package` comprable si hay ≥ 1 unidad base (puede vender solo `unitQuantity`).
- **Fallo:** Rechazar checkout guest si cantidad fuera de rango; UI tienda deshabilita compra si no hay stock para el mínimo.

---

## Packs / combos (S1F)

### Regla 22 — Pack sin stock propio

- **Trigger:** Cualquier operación sobre pack/combo.
- **Pasos:** `catalog.packs` **no** tiene columnas de stock. Por componente activo (`is_active`, sin `deleted_at`): `needBase = package_quantity × items_per_package + unit_quantity`; `availableBase` según Regla 4 (`package` = sealed×ipp+loose; `unit` = solo loose). Disponibilidad del combo = mínimo de `floor(availableBase / needBase)`.
- **Implementación:** `@de-tin-marin/shared/pack-availability` — `computePackAvailableQuantity` (ecommerce, checkout, Excel, listados admin) y `listPackStockShortages` (componentes bottleneck: `missing_product` | `inactive` | `insufficient_stock`).
- **DTO admin list:** `PackListItem.availableQuantity` + `stockShortages` (vacío si `availableQuantity >= 1`).
- **Fallo:** N/A.

### Regla 23 — Precio pack reference + normal

- **Trigger:** Crear/editar pack; listar; armar línea de orden.
- **Pasos:**
  1. `reference.netPrice = Σ (product.prices.normal.netPrice × package_quantity + product.prices.unit.netPrice × unit_quantity)` (recalculado en backend al guardar). Invariante BOM: `package_quantity >= 0`, `unit_quantity >= 0`, `package_quantity + unit_quantity >= 1` (una fila por producto).
  2. Admin define `normal.netPrice`; **obligatorio** `normal.netPrice >= reference.netPrice`.
  3. Descuentos solo vía campaña 1:1 (`campaign_id`) sobre `normal` → `finalPrice`.
  4. Congelar `unitPrice` (= finalPrice) y BOM (`packageQuantity`, `unitQuantity`, `totalPackages`, `totalUnits`) en `shopping_cart` línea `type: pack`.
- **UI admin (picker):** misma semántica que Regla 6 — `ProductSearchPicker` + productos activos por defecto; al editar, `mergePackProductOptions` conserva ítems ya en la BOM; create/update solo productos activos (`validatePackItems`).
- **Fallo:** Rechazar save/checkout si `normal < reference` o items inválidos.

### Regla 24 — Deduct pack al pagar

- **Trigger:** Orden → `paid` (Regla 15).
- **Pasos:** Por cada línea `type: pack`, por cada componente: `presentationQuantity += totalPackages` (`packageQuantity × line.quantity`); `baseUnits += totalUnits` (`unitQuantity × line.quantity`; legacy sin campo → 0). Deduct vía pipeline compartido (Regla 15 / `product_type`). **No** alterar el branch `type: bundle`.
- **Fallo:** Stock insuficiente → rollback; orden no `paid`.

### Regla 25 — Límites min/max de compra (packs)

- **Trigger:** Agregar pack al carrito / checkout guest (**solo ecommerce / storefront**).
- **Alcance:** Líneas `type: pack`.
- **Excepción admin:** order-form salta min/max de compra del pack; cantidad `>= 1` acotada por `availableQuantity` (Regla 22). **Jamás** en front ecommerce.
- **Pasos (ecommerce):** Igual espíritu Regla 21 usando `packs.purchase_min_quantity` / `purchase_max_quantity` y disponibilidad derivada de componentes (Regla 22).
- **UI admin:** `resolvePackAddBlockReason` → `OUT_OF_STOCK` si `availableQuantity < 1`; mensaje con nombres de `stockShortages`.
- **Fallo:** Rechazar checkout guest si cantidad fuera de rango o stock insuficiente para el mínimo.

### Regla 26 — Costo de adquisición y margen (productos, admin)

- **Trigger:** Crear/editar/listar producto en admin; export Excel Productos (S4-01).
- **Pasos:**
  1. Persistir opcionalmente `catalog.products.cost_net_price` (nullable, `>= 0`) — costo proveedor de la **presentación**.
  2. Margen derivado (no persistido): `margin = prices.normal.netPrice − cost_net_price`.
  3. `% = margin / cost_net_price` solo si `cost_net_price > 0`; si costo es `null` o `0` → margen y % = `null` (UI/Excel "—").
  4. Helper: `@de-tin-marin/shared/product-margin` (`computeProductMargin`).
- **Alcance:** Solo admin + Excel. **No** exponer en DTOs públicos ecommerce ni en Orders/Pricing de venta.
- **Fallo:** Rechazar save si `cost_net_price < 0`.

---

## Settings públicos

### Regla 27 — Contacto e instrucciones de pago

- **Trigger:** Staff modifica `/business-settings`; ecommerce muestra contacto
  o una orden guest queda pendiente de pago.
- **Pasos:**
  1. Fuente única: singleton `core.public_business_settings` con
     `singleton_key = 'default'`.
  2. Staff actualiza mediante Server Action autenticada/autorizada + Zod:
     WhatsApp E.164, email, Yape/titular y banco/titular/cuenta/CCI.
  3. Ecommerce consume solo `PublicBusinessSettings` (allowlist validada):
     FAB WhatsApp, Nosotros, Términos, Privacidad y las instrucciones de
     confirmación/lookup cuando `status = pending_payment`.
  4. Las instrucciones no se guardan en `orders`, `payment_methods` ni
     `commerce.payments`; son vigentes al momento de visualizarse.
- **RLS:** `SELECT` público deliberado; `UPDATE` solo staff. No hay
  `INSERT`/`DELETE` público para preservar el singleton.
- **Fallo:** Rechazar configuración inválida; no renderizar ni fabricar datos
  estáticos si la configuración pública no está disponible.

### Regla 29 — Imagen de Nosotros (personalización web)

- **Trigger:** Staff sube o restaura la foto en `/web-customization` (pestaña
  Nosotros); ecommerce renderiza `/nosotros`.
- **Pasos:**
  1. Fuente única: singleton `core.about_page_settings.image_url` (nullable).
  2. Staff sube landscape ~16:9 (±5 %), ancho ≥800 px → presign folder `about`
     → PUT al guardar → URL CDN en DB.
  3. Restaurar default persiste `image_url = null`.
  4. Ecommerce SSR lee settings; `resolveAboutStoryImageUrl` usa CDN o
     `ABOUT_STORY_IMAGE_URL` (placeholder).
  5. Copy de misión/visión/valores **no** vive en esta tabla — solo la foto.
- **RLS:** `SELECT` público; `UPDATE` solo staff. Sin `INSERT`/`DELETE` público.
- **Fallo:** Rechazar archivo inválido en admin; fetch/parse error en ecommerce
  **no** tumba la página — fallback obligatorio.

---

## Notificaciones

### Regla 28 — Email de orden creada

- **Trigger:** Una orden se persiste correctamente desde checkout ecommerce o
  desde admin.
- **Pasos:**
  1. El service persiste la orden primero.
  2. Luego **await** `scheduleOrderCreatedNotification` (sin `after()`): arma
     un DTO allowlist desde el snapshot y envía SMTP en el mismo request.
  3. Ecommerce envía al cliente y a los destinatarios administrativos; admin
     solo a los destinatarios administrativos.
  4. El destinatario principal admin es
     `core.public_business_settings.email`; los extras de
     `ORDER_NOTIFY_EXTRA_EMAILS` son opcionales, validados y deduplicados.
  5. Si SMTP está incompleto se omite el envío con warning. Si falla,
     se registra error seguro sin PII (`notify_start` / `NOTIFY_FAILED` /
     `notified`) y la orden conserva éxito.
- **Alcance:** SMTP/Nodemailer server-only (puerto 587, `secure: false`),
  HTML + texto plano. No outbox, reintentos, estado de entrega, webhook ni
  tablas nuevas en v1. El await puede alargar la latencia de create order.
- **Fallo:** Un error de notificación no revierte la orden, totales, pago ni
  stock. El lookup guest sigue siendo el canal de consulta fiable.

---

## Fulfillment — puntos de recojo

### Regla 30 — Catálogo de puntos de recojo

- **Trigger:** Staff CRUD en `/delivery`; checkout lista puntos; create
  orden `pickup_point`.
- **Pasos:**
  1. Fuente: `pricing.pickup_points` (`name` único, coords, `fee >= 0`,
     `is_active`, `sort_order`).
  2. Kill switch global: `delivery_settings.pickup_points_enabled`. Off →
     listado público vacío y checkout sin opción.
  3. Ecommerce lista solo activos. Create **rehidrata** `{ id, name, lat,
lng, fee }` desde DB (no confiar en el cliente). Punto ausente o
     inactivo → error, no orden.
  4. El snapshot vive en `orders.fulfillment`; cambios posteriores del
     catálogo no reescriben órdenes históricas.
- **RLS:** SELECT público de filas `is_active`; staff SELECT/CRUD completo.
- **Fallo:** Guest no puede persistir `pickup` ni fulfillment XOR inválido
  (`insert_guest_order`).

---

## Fulfillment — envío courier (agencia nacional)

### Regla 31 — Catálogo courier + snapshot guest

- **Trigger:** Staff toggles en `/delivery` (pestaña Envío por agencia);
  checkout guest elige `courier`; create orden admin/ecommerce guest.
- **Pasos:**
  1. Fuente: `pricing.courier_departments` — una fila por departamento;
     `provinces` jsonb array fijo (`slug`, `name`, `enabled`); staff solo
     togglea `enabled` e `is_active` del departamento (no crea provincias).
  2. Kill switch global: `delivery_settings.courier_enabled`. Off → listado
     checkout vacío.
  3. Cobertura checkout: dept `is_active` **y** provincia `enabled` en JSON.
     **Provincia Piura** no debe existir en el catálogo courier del dept.
     Piura (local) → `method: delivery`.
  4. Guest/admin create **rehidrata** destino desde DB (`departmentId`,
     `provinceSlug` → nombres congelados). Cliente completa
     `recipient` (`dni`, `fullName`, `agencyAddress`).
  5. **`shipping_total = 0`** siempre para `courier` (flete en agencia).
     RPC guest rechaza `shipping_total > 0`.
  6. Snapshot en `orders.fulfillment.courier`; XOR: sin `deliveryAddress`,
     `pickupPoint` ni `mapPin`.
  7. Logística post-`ready`: igual que `delivery` → `in_transit` (carrier +
     tracking) → `delivered` (DECISIONS #42 / #43).
- **RLS:** SELECT público solo dept `is_active`; staff CRUD completo.
- **Fallo:** Destino disabled/inactivo → sin cobertura checkout / error al
  submit; XOR inválido rechazado por Zod y RPC.

---

## Storefront — reglas generales de tienda

### Regla 32 — Promo envío, pedido mínimo y aviso

- **Trigger:** Staff edita `/storefront-settings`; checkout guest resuelve
  fee / submit; admin order-form resuelve fee.
- **Pasos:**
  1. Fuente: `core.storefront_settings` singleton (`default`). **No**
     mezclar con `pricing.delivery_settings` (tarifas base / kill switches)
     ni `core.public_business_settings` (contacto/pagos).
  2. **Promo envío:** si el flag del método está on (`free_delivery` /
     `free_pickup_point`) **y** la ventana compartida admite `now()`:
     bound null = sin límite en ese lado; ambos null = siempre vigente;
     ambos set → `starts ≤ now ≤ ends` (invalid dates → no vigente). Entonces
     el fee base del método pasa a **0** vía overlay
     (`applyStorefrontShippingFee`). Las fees de `delivery_zones` /
     `pickup_points` **no** se ponen en 0 en DB.
  3. Courier y pickup-en-tienda no cambian por esta promo (courier ya es 0;
     pickup tienda no es guest).
  4. **Pedido mínimo:** si `min_order_subtotal > 0`, guest exige
     `subtotal >=` ese monto (`ORDER_BELOW_MINIMUM`). Compara el subtotal
     congelado del carrito, **antes** de `shipping_total`. No relaja
     `purchase_min_quantity` por producto (Regla 21).
  5. **Admin order-form** aplica el overlay de fee para consistencia de
     snapshot, pero **no** bloquea por pedido mínimo (igual que min/max
     producto).
  6. **Aviso:** si `announcement_enabled` y mensaje no vacío → banner en
     checkout.
- **RLS:** `SELECT` público; `UPDATE` staff.
- **Fallo:** Guest bajo el mínimo → no crea orden; fee cliente ≠ fee
  resuelto (con overlay) → `SHIPPING_FEE_MISMATCH`.

---

## Futuro (v2 — no implementar en v1)

| ID  | Tema                           |
| --- | ------------------------------ |
| —   | Cupones                        |
| —   | Cliente VIP / tier             |
| —   | Ledger `inventory_movements`   |
| —   | Pasarela de pagos automática   |
| —   | Precios `suggested`, `fantasy` |

---

## Índice rápido

| ID    | Dominio            | Resumen                                                            |
| ----- | ------------------ | ------------------------------------------------------------------ |
| 1–4   | Products           | SKU, prices JSONB, activo, stock por `product_type` (unit/package) |
| 5–8   | Bundles            | Sin stock dulces, plantilla + envase, personalización, precio      |
| 9–12  | Pricing            | Final en backend, 1:1 campaña, vigencia, motor único               |
| 13–16 | Orders             | Snapshot; estados (+ logística #42); stock al pagar; no recalcular |
| 17–18 | Payments / cancel  | Confirm manual; cancel atómico (refund + restock, DECISIONS #41)   |
| 19–20 | Delivery / Envases | Fee base + overlay R32; pickup/pickup_point/courier→R31; envase    |
| 21    | Products           | Min/max compra por presentación (default 10/100)                   |
| 22–25 | Packs / combos     | Sin stock propio, reference dual qty, deduct pkg+unit, min/max     |
| 26    | Products (admin)   | Costo proveedor + margen/% derivado (DECISIONS #36)                |
| 27    | Settings públicos  | Contacto + instrucciones Yape/transferencia dinámicas              |
| 28    | Notifications      | Email SMTP post-creación (await best-effort; no tumba la orden)    |
| 29    | Settings públicos  | Imagen “Nuestra Historia” en `/nosotros` (singleton + fallback)    |
| 30    | Fulfillment        | Catálogo puntos de recojo + snapshot; guest sin `pickup` tienda    |
| 31    | Fulfillment        | Courier agencia: dept/provincias JSON; fee 0; snapshot guest XOR   |
| 32    | Storefront         | Promo envío overlay; min pedido sobre subtotal; aviso checkout     |

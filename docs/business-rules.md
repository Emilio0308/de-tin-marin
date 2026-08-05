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
  2. Coherencia con presentación: `|prices.unit.netPrice × items_per_package − prices.normal.netPrice| ≤ 0.01`.
  3. Si `items_per_package = 1`, `normal` y `unit` deben ser idénticos.
- **Fallo:** Rechazar validación.
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
- **Nota:** Líneas `type: product` congelan `quantity` en **presentaciones** vendidas. Componentes de pack usan **presentaciones** (`totalPackages`). Componentes de bundle usan **unidad base** (`totalQuantity`).

---

## Bundles (sorpresas)

### Regla 5 — Plantilla sin stock

- **Trigger:** Cualquier operación sobre bundle.
- **Pasos:** Los bundles **no tienen** `stock_quantity`. Se arman **por demanda** al crear la orden.
- **Fallo:** N/A.

### Regla 6 — Composición base de plantilla

- **Trigger:** Crear/editar bundle en admin.
- **Pasos:** `bundle_items` referencia productos existentes y activos; al menos un item; **`container_id`** apunta a envase activo en `catalog.surprise_containers`.
- **UI admin (picker):** por defecto solo productos activos (`listProducts` con `status: "active"`). Al editar, ítems ya guardados en la plantilla se muestran aunque el producto esté inactivo (`mergeBundleProductOptions`). Switch “incluir inactivos” detrás de flag `SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH` (hoy `false`); habilitarlo sin relajar la validación de write falla con `PRODUCT_NOT_FOUND`.
- **Persistencia:** create/update rechazan productos inactivos (`getActiveProductsByIdsRepo`).
- **Fallo:** Rechazar bundle vacío, productos inválidos o envase inactivo.

### Regla 7 — Personalización en la orden

- **Trigger:** Cliente crea/edita una sorpresa en el pedido.
- **Pasos:** Partir de plantilla `bundle_items`; permitir agregar, quitar o **reemplazar** productos y ajustar cantidades por sorpresa. Persistir snapshot en `orders.shopping_cart` (línea `type: bundle`, independiente de la plantilla).
- **Fallo:** Rechazar productos inactivos o cantidades <= 0.

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

- **Trigger:** Cambiar `orders.status`.
- **Pasos:** Solo transiciones de [`orders.md`](orders.md).
- **Fallo:** Rechazar ilegal.

### Regla 15 — Descuento de stock al pagar (v1)

- **Trigger:** Operador confirma pago → orden `paid` (Regla 17).
- **Pasos (transacción atómica — `commerce.deduct_stock_for_order`):**
  1. Agregar demandas por `product_id`:
     - Líneas `type: product`: `presentationQuantity += quantity` (presentaciones vendidas).
     - Componentes de líneas `type: pack`: `presentationQuantity += totalPackages` (`packageQuantity × line.quantity`) — Regla 24.
     - Componentes de líneas `type: bundle`: `baseUnits += totalQuantity` (unidad base).
  2. Por producto, `need` en unidades base:
     - `need = presentationQuantity × items_per_package + baseUnits` (con `items_per_package >= 1`).
  3. Deduct según `product_type` (helpers shared: `deductProductStock` / SQL alineado):
     - **`package`:** consumir loose primero; si falta, abrir sealed y volcar sobrante a loose; normalizar (`deductBaseUnits`).
     - **`unit`:** descontar **solo** `stock_loose_base_units`; **no** tocar `stock_sealed_packages` (`deductUnitProductLoose`). Si loose < need → insuficiente aunque haya sealed.
  4. Por cada línea bundle con `container` congelado: descontar `line.quantity` de `surprise_containers.stock_quantity` (Regla 20). Líneas legacy solo con `serviceFee` → omitir envase.
  5. Si cualquier producto **o envase** queda con stock insuficiente → **ROLLBACK** completo; orden no queda `paid`.
- **Fallo:** Notificar operador; stock no mutado.
- **Tests:** Lay’s `package` 5 tiras × 10: pedido 3 presentaciones → sealed=2, loose=0; producto `unit` con sealed=50, loose=20, pedido 10 → loose=10, sealed intacto; pack con componentes en presentaciones; bundle 25 sorpresas → -25 envases.

### Regla 16 — Orders no recalcula precios

- **Trigger:** Post-checkout.
- **Pasos:** Usar valores congelados en `orders.shopping_cart`.
- **Fallo:** Prohibido invocar recálculo de precios.

---

## Payments (v1 manual)

### Regla 17 — Confirmación manual

- **Trigger:** Operador registra pago en admin.
- **Pasos:** Insertar/actualizar `commerce.payments` (`status = confirmed`, `confirmed_by`, `notes`) → transicionar orden a `paid` → disparar Regla 15.
- **Fallo:** No confirmar `paid` sin registro en `payments`.

### Regla 18 — Reembolso manual

- **Trigger:** Operador marca reembolso.
- **Pasos:** `payments.status = refunded`; cambiar estado de orden según política; **reversión de stock manual** por operador en v1 (ajuste `stock_sealed_packages` / `stock_loose_base_units` en productos y `stock_quantity` en envases).
- **Fallo:** Auditar en `audit_log`.

---

## Envases de sorpresa (insumos — S1E)

### Regla 19 — Delivery configurable

- **Trigger:** Crear orden con `fulfillment.method = delivery`.
- **Pasos:**
  1. Resolver tarifa desde `pricing.delivery_zones` donde `district` coincide (case-insensitive, trim) y `is_active`.
  2. Si no hay match → `pricing.delivery_settings.fallback_fee`.
  3. Si `method = pickup` → `shipping_total = 0`.
  4. Congelar `shipping_total` en `orders.shipping_total` al crear la orden.
- **Fallo:** Rechazar delivery si `delivery_enabled = false` (cuando se aplique validación operativa).

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

- **Trigger:** Agregar al carrito, editar cantidad en carrito, checkout guest.
- **Alcance:** Líneas `type: product`. **No** aplica a sorpresas/bundles ni wizard. Packs: ver Regla 25.
- **Pasos:**
  1. Leer `purchase_min_quantity` y `purchase_max_quantity` del producto (cantidad en **presentación** vendida: unidad o paquete/tira).
  2. `stock_presentaciones` alineado con disponibilidad vendible (Regla 4):
     - `unit` → `stock_loose_base_units` (solo sueltas).
     - `package` → `floor(totalBaseUnits / items_per_package)` con `totalBaseUnits = sealed × items_per_package + loose`.
  3. `max_efectivo = min(purchase_max_quantity, stock_presentaciones)`.
  4. Comprable solo si `stock_presentaciones >= purchase_min_quantity`.
  5. Cantidad de línea debe cumplir `purchase_min_quantity <= quantity <= max_efectivo`.
  6. “Añadir rápido” agrega `purchase_min_quantity` por defecto.
- **Fallo:** Rechazar checkout si cantidad fuera de rango; UI deshabilita compra si no hay stock para el mínimo.

---

## Packs / combos (S1F)

### Regla 22 — Pack sin stock propio

- **Trigger:** Cualquier operación sobre pack/combo.
- **Pasos:** `catalog.packs` **no** tiene columnas de stock. Disponibilidad = mínimo de `floor(stock_presentaciones_producto / package_quantity)` sobre componentes **activos** (`is_active` y sin `deleted_at`). Presentaciones por producto según Regla 4 (`unit` = solo loose; `package` = sealed×ipp+loose).
- **Implementación:** `@de-tin-marin/shared/pack-availability` (`computePackAvailableQuantity`) — usada en ecommerce, checkout y export admin (S4-01).
- **Fallo:** N/A.

### Regla 23 — Precio pack reference + normal

- **Trigger:** Crear/editar pack; listar; armar línea de orden.
- **Pasos:**
  1. `reference.netPrice = Σ (product.prices.normal.netPrice × package_quantity)` (recalculado en backend al guardar).
  2. Admin define `normal.netPrice`; **obligatorio** `normal.netPrice >= reference.netPrice`.
  3. Descuentos solo vía campaña 1:1 (`campaign_id`) sobre `normal` → `finalPrice`.
  4. Congelar `unitPrice` (= finalPrice) y BOM en `shopping_cart` línea `type: pack`.
- **UI admin (picker):** misma semántica que Regla 6 — productos activos por defecto; al editar, `mergePackProductOptions` conserva ítems ya en la BOM; create/update solo productos activos (`validatePackItems`).
- **Fallo:** Rechazar save/checkout si `normal < reference` o items inválidos.

### Regla 24 — Deduct pack al pagar

- **Trigger:** Orden → `paid` (Regla 15).
- **Pasos:** Por cada línea `type: pack`, por cada componente: sumar `totalPackages = packageQuantity × line.quantity` a `presentationQuantity` del producto; deduct como líneas product (Regla 15 / `product_type`).
- **Fallo:** Stock insuficiente → rollback; orden no `paid`.

### Regla 25 — Límites min/max de compra (packs)

- **Trigger:** Agregar pack al carrito / crear orden admin.
- **Alcance:** Líneas `type: pack`.
- **Pasos:** Igual espíritu Regla 21 usando `packs.purchase_min_quantity` / `purchase_max_quantity` y disponibilidad derivada de componentes (Regla 22).
- **Fallo:** Rechazar si cantidad fuera de rango o stock insuficiente para el mínimo.

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
| 13–16 | Orders             | Snapshot, estados, stock al pagar, no recalcular                   |
| 17–18 | Payments           | Manual confirm / refund                                            |
| 19–20 | Delivery / Envases | Tarifa por distrito; stock envase 1:1 sorpresa                     |
| 21    | Products           | Min/max compra por presentación (default 10/100)                   |
| 22–25 | Packs / combos     | Sin stock propio, reference/normal, deduct presentaciones, min/max |
| 26    | Products (admin)   | Costo proveedor + margen/% derivado (DECISIONS #36)                |

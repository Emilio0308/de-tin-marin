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
  1. Fuente de verdad: `stock_sealed_packages` + `stock_loose_base_units` + `items_per_package`.
  2. Total disponible: `totalBaseUnits = sealed × items_per_package + loose`.
  3. Tras cada movimiento, normalizar: si `loose >= items_per_package`, convertir excedente a paquetes cerrados.
  4. Display: `"X {package_label} + Y bolsas"` derivado de sealed/loose.
- **Fallo:** Si stock insuficiente al pagar → Regla 15 revierte.
- **Nota:** Todas las cantidades en órdenes y bundles usan **unidad base** (bolsa).

---

## Bundles (sorpresas)

### Regla 5 — Plantilla sin stock

- **Trigger:** Cualquier operación sobre bundle.
- **Pasos:** Los bundles **no tienen** `stock_quantity`. Se arman **por demanda** al crear la orden.
- **Fallo:** N/A.

### Regla 6 — Composición base de plantilla

- **Trigger:** Crear/editar bundle en admin.
- **Pasos:** `bundle_items` referencia productos existentes y activos; al menos un item; **`container_id`** apunta a envase activo en `catalog.surprise_containers`.
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
- **Pasos (transacción atómica — implementación S2A):**
  1. Por cada línea `type: product` en `shopping_cart.lines`: descontar `quantity` **unidades base** (algoritmo sealed/loose).
  2. Por cada `component` en líneas `type: bundle`: descontar `totalQuantity` **unidades base** del producto.
  3. Algoritmo deduct por producto (`need` = unidades base requeridas):
     - Consumir `stock_loose_base_units` primero.
     - Si falta, abrir paquetes cerrados (`stock_sealed_packages -= 1`) y volcar sobrante a loose.
     - Normalizar loose/sealed tras cada producto.
  4. Por cada línea bundle con `container` congelado: descontar `line.quantity` de `surprise_containers.stock_quantity` (Regla 20). Líneas legacy solo con `serviceFee` → omitir envase.
  5. Si cualquier producto **o envase** queda con stock insuficiente → **ROLLBACK** completo; orden no queda `paid`.
- **Fallo:** Notificar operador; stock no mutado.
- **Tests:** Integración obligatoria (ej. Lay’s: 50 bolsas, pedido 25 → sealed=2, loose=5; bundle 25 sorpresas → -25 envases).

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
- **Alcance:** Solo líneas `type: product`. **No** aplica a sorpresas/bundles ni wizard.
- **Pasos:**
  1. Leer `purchase_min_quantity` y `purchase_max_quantity` del producto (cantidad en **presentación** vendida: unidad o paquete/tira).
  2. `stock_presentaciones` = unidades base totales si `product_type = unit`; si `package` → `floor(totalBaseUnits / items_per_package)`.
  3. `max_efectivo = min(purchase_max_quantity, stock_presentaciones)`.
  4. Comprable solo si `stock_presentaciones >= purchase_min_quantity`.
  5. Cantidad de línea debe cumplir `purchase_min_quantity <= quantity <= max_efectivo`.
  6. “Añadir rápido” agrega `purchase_min_quantity` por defecto.
- **Fallo:** Rechazar checkout si cantidad fuera de rango; UI deshabilita compra si no hay stock para el mínimo.

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

| ID    | Dominio            | Resumen                                                       |
| ----- | ------------------ | ------------------------------------------------------------- |
| 1–4   | Products           | SKU, prices JSONB (normal+unit), activo, stock sealed/loose   |
| 5–8   | Bundles            | Sin stock dulces, plantilla + envase, personalización, precio |
| 9–12  | Pricing            | Final en backend, 1:1 campaña, vigencia, motor único          |
| 13–16 | Orders             | Snapshot, estados, stock al pagar, no recalcular              |
| 17–18 | Payments           | Manual confirm / refund                                       |
| 19–20 | Delivery / Envases | Tarifa por distrito; stock envase 1:1 sorpresa                |
| 21    | Products           | Min/max compra por presentación (default 10/100)              |

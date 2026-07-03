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
- **Pasos:** `prices.normal` debe existir con `netPrice >= 0`, `igv >= 0`, `subtotal >= 0`, y `subtotal + igv = netPrice` (tolerancia centavos).
- **Fallo:** Rechazar validación.
- **Nota:** `netPrice` es precio final al cliente (IGV incluido).

### Regla 3 — Producto inactivo no vendible

- **Trigger:** Carrito / checkout / composición de bundle.
- **Pasos:** Rechazar si `is_active = false` o `deleted_at IS NOT NULL`.
- **Fallo:** "Producto no disponible".

### Regla 4 — Stock en producto (v1)

- **Trigger:** Consultar disponibilidad / confirmar orden.
- **Pasos:** Leer y mutar `catalog.products.stock_quantity` directamente.
- **Fallo:** Si stock insuficiente al pagar → Regla 14 revierte.

---

## Bundles (sorpresas)

### Regla 5 — Plantilla sin stock

- **Trigger:** Cualquier operación sobre bundle.
- **Pasos:** Los bundles **no tienen** `stock_quantity`. Se arman **por demanda** al crear la orden.
- **Fallo:** N/A.

### Regla 6 — Composición base de plantilla

- **Trigger:** Crear/editar bundle en admin.
- **Pasos:** `bundle_items` referencia productos existentes y activos; al menos un item con `quantity > 0` para publicar.
- **Fallo:** Rechazar bundle vacío o productos inválidos.

### Regla 7 — Personalización en la orden

- **Trigger:** Cliente crea/edita una sorpresa en el pedido.
- **Pasos:** Partir de plantilla `bundle_items`; permitir agregar, quitar o **reemplazar** productos y ajustar cantidades por sorpresa. Persistir snapshot en `order_bundle_items` (independiente de la plantilla).
- **Fallo:** Rechazar productos inactivos o cantidades <= 0.

### Regla 8 — Precio de sorpresa en orden

- **Trigger:** Calcular total de línea bundle.
- **Pasos:**

```text
line_total =
  Σ (total_quantity × unit_price_final_producto)   // precio con campaña ya aplicado
  + service_fee × order_item.quantity              // fee congelado del bundle
```

- `service_fee` es editable por bundle en backoffice y se congela en `order_items.service_fee`.
- **Fallo:** N/A.

---

## Pricing y campañas

### Regla 9 — Precio final en backend (productos)

- **Trigger:** Listar productos (ecommerce o admin).
- **Pasos:**
  1. Leer `prices.normal`.
  2. Si `campaign_id` apunta a campaña **vigente** (`starts_at <= now <= ends_at`, `is_active`):
     - `finalPrice = netPrice × (1 - percentage/100)`
     - Incluir desglose IGV proporcional si el front lo necesita.
  3. Si no hay campaña o expiró → `finalPrice = netPrice`.
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
- **Pasos:** Persistir `order_items` (precios, `service_fee`) y `order_bundle_items` (composición). Guardar `pricing_snapshot` en `orders`.
- **Fallo:** Rechazar transición sin snapshot.

### Regla 14 — Transiciones de estado válidas

- **Trigger:** Cambiar `orders.status`.
- **Pasos:** Solo transiciones de [`orders.md`](orders.md).
- **Fallo:** Rechazar ilegal.

### Regla 15 — Descuento de stock al pagar (v1)

- **Trigger:** Operador confirma pago → orden `paid`.
- **Pasos (transacción atómica):**
  1. Por cada `order_item` tipo **product**: `stock_quantity -= quantity`.
  2. Por cada `order_bundle_item`: `stock_quantity -= total_quantity` del producto componente.
  3. Si cualquier `stock_quantity < 0` → **ROLLBACK** completo; orden no queda `paid`.
- **Fallo:** Notificar operador; stock no mutado.
- **Tests:** Integración obligatoria.

### Regla 16 — Orders no recalcula precios

- **Trigger:** Post-checkout.
- **Pasos:** Usar valores congelados en `order_items` / `order_bundle_items`.
- **Fallo:** Prohibido invocar recálculo de precios.

---

## Payments (v1 manual)

### Regla 17 — Confirmación manual

- **Trigger:** Operador registra pago en admin.
- **Pasos:** Insertar/actualizar `commerce.payments` (`status = confirmed`, `confirmed_by`, `notes`) → transicionar orden a `paid` → disparar Regla 15.
- **Fallo:** No confirmar `paid` sin registro en `payments`.

### Regla 18 — Reembolso manual

- **Trigger:** Operador marca reembolso.
- **Pasos:** `payments.status = refunded`; cambiar estado de orden según política; **reversión de stock manual** por operador en v1 (ajuste `stock_quantity` en admin).
- **Fallo:** Auditar en `audit_log`.

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

| ID    | Dominio  | Resumen                                              |
| ----- | -------- | ---------------------------------------------------- |
| 1–4   | Products | SKU, prices JSONB, activo, stock v1                  |
| 5–8   | Bundles  | Sin stock, plantilla, personalización, precio línea  |
| 9–12  | Pricing  | Final en backend, 1:1 campaña, vigencia, motor único |
| 13–16 | Orders   | Snapshot, estados, stock al pagar, no recalcular     |
| 17–18 | Payments | Manual confirm / refund                              |

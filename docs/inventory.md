# Inventory — De Tin Marín

> **v1 simplificado:** el stock vive en **`catalog.products.stock_quantity`**. Sin schema `inventory` ni ledger de movimientos hasta v2.

## Fuente de verdad (v1)

`catalog.products.stock_quantity` — Regla 4.

El dominio Inventory en v1 se reduce a:

- Lectura de stock para disponibilidad
- Descuento atómico al confirmar pago (Regla 15)
- Ajuste manual en admin

## Descuento al pagar — Regla 15

Cuando el operador confirma pago y la orden pasa a `paid`:

```text
BEGIN TRANSACTION
  FOR order_item WHERE item_type = 'product':
    products.stock_quantity -= order_item.quantity

  FOR order_bundle_item IN líneas bundle de la orden:
    products.stock_quantity -= order_bundle_item.total_quantity

  IF ANY products.stock_quantity < 0 → ROLLBACK
COMMIT
```

Implementar como función `commerce.deduct_stock_for_order(p_order_id)` SECURITY DEFINER o transacción en service con `SELECT ... FOR UPDATE` en filas de productos afectados.

## Bundles / sorpresas

- **Sin stock propio** en `bundles`.
- Disponibilidad de una sorpresa = mínimo de `floor(stock_producto / cantidad_requerida)` sobre componentes del snapshot.
- Validar antes de confirmar orden; bloquear si insuficiente.

## Admin (v1)

- Ver/editar `stock_quantity` por producto
- Ajuste manual con motivo (registrar en `audit_log`)
- Sin historial de movimientos en v1

## Reembolso / cancelación (v1)

Reversión de stock **manual** por operador — incrementar `stock_quantity` en admin. Ledger automático → v2.

## v2 (planificado)

| Feature                      | Tabla                                              |
| ---------------------------- | -------------------------------------------------- |
| Ledger movimientos           | `inventory.inventory_movements`                    |
| Fuente de verdad desacoplada | `inventory.inventory_items`                        |
| Trazabilidad por orden       | reason: sale, bundle_component, adjustment, return |

## API (planificada v1)

| Action                | Rol    | Descripción               |
| --------------------- | ------ | ------------------------- |
| `adjustProductStock`  | admin  | Ajuste manual + audit     |
| `checkOrderStock`     | server | Pre-confirmar pago        |
| `deductStockForOrder` | server | Llamado al pasar a `paid` |

## Tests obligatorios

- Venta producto simple decrementa `stock_quantity`
- Sorpresa con N componentes decrementa cada producto
- Stock insuficiente → rollback, orden no `paid`
- Ajuste manual incrementa/decrementa

## Reglas relacionadas

Reglas 4, 15, 18 en [`business-rules.md`](business-rules.md).

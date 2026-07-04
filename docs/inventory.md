# Inventory — De Tin Marín

> **v1 simplificado:** el stock vive en **`catalog.products.stock_quantity`**. Sin schema `inventory` ni ledger de movimientos hasta v2.

## Implementación por etapa

| Etapa         | Qué incluye                                         |
| ------------- | --------------------------------------------------- |
| **S1A** ✅    | Columna `stock_quantity`; edición manual en admin   |
| **S2B / S2C** | Sin deduct ni validación de stock                   |
| **S2A**       | `deduct_stock_for_order` al confirmar pago (`paid`) |

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
  FOR line IN shopping_cart.lines WHERE type = 'product':
    products.stock_quantity -= line.quantity

  FOR component IN bundle.components (líneas type = 'bundle'):
    products.stock_quantity -= component.totalQuantity

  IF ANY products.stock_quantity < 0 → ROLLBACK
COMMIT
```

Implementar en **S2A** como `commerce.deduct_stock_for_order(p_order_id)` SECURITY DEFINER, enganchada al confirmar pago (S2C). Alternativa: transacción en service con `SELECT ... FOR UPDATE` en filas afectadas.

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

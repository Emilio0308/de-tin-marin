# Inventory — De Tin Marín

> **v1:** stock en **`catalog.products`** como paquetes cerrados + unidades sueltas. Sin schema `inventory` ni ledger de movimientos hasta v2.

## Implementación por etapa

| Etapa         | Qué incluye                                                               |
| ------------- | ------------------------------------------------------------------------- |
| **S1A** ✅    | Columna `stock_quantity` (legacy)                                         |
| **S1D**       | `stock_sealed_packages` + `stock_loose_base_units`; drop `stock_quantity` |
| **S2B / S2C** | Sin deduct ni validación de stock                                         |
| **S2A** ✅    | `confirm_payment_with_stock_deduct` + `checkOrderStock`                   |

## Fuente de verdad (v1)

Dos columnas en `catalog.products` (DECISIONS #29, Regla 4):

| Columna                  | Significado                             |
| ------------------------ | --------------------------------------- |
| `stock_sealed_packages`  | Paquetes/tiras **cerrados**             |
| `stock_loose_base_units` | Unidades base sueltas (bolsas abiertas) |

```text
totalBaseUnits = stock_sealed_packages × items_per_package + stock_loose_base_units
```

**Unidad base** = bolsa/unidad que consume cada sorpresa (`units_per_person` en bundles).

### Normalización

Tras cada ajuste o deduct:

```text
si stock_loose_base_units >= items_per_package:
  stock_sealed_packages += floor(loose / items_per_package)
  stock_loose_base_units = loose % items_per_package
```

### Display admin

Ejemplo Lay’s (`items_per_package = 10`, `package_label = "tira"`):

| sealed | loose | Display            | totalBaseUnits |
| ------ | ----- | ------------------ | -------------- |
| 5      | 0     | 5 tiras            | 50             |
| 2      | 5     | 2 tiras + 5 bolsas | 25             |

## Algoritmo de descuento (S2A — Regla 15)

Entrada: `need` = unidades base a consumir (desde `shopping_cart`).

```text
1. take = min(need, stock_loose_base_units)
   need -= take; loose -= take

2. Mientras need > 0:
     si sealed == 0 → INSUFFICIENT_STOCK
     sealed -= 1                         // abrir un paquete
     from_open = items_per_package
     take = min(need, from_open)
     need -= take
     loose += (from_open - take)         // sobrante a sueltas

3. Normalizar loose/sealed
```

**Ejemplo:** 5 tiras (50 bolsas), pedido 25 → quedan 2 tiras + 5 bolsas.

Implementar en **S2A** como `commerce.deduct_stock_for_order(p_order_id)` SECURITY DEFINER, enganchada al confirmar pago (S2C).

Helpers compartidos en `@de-tin-marin/shared` (S1D): `normalizeProductStock`, `deductBaseUnits`.

## Bundles / sorpresas

- **Sin stock propio** en `bundles`.
- Disponibilidad = mínimo de `floor(totalBaseUnits_producto / cantidad_requerida)` sobre componentes.
- Cantidades en snapshot = **unidades base** (`totalQuantity` por componente).

## Admin (v1)

- Ver/editar `stock_sealed_packages` y `stock_loose_base_units` por producto
- Entrada alternativa: “Recibí N tiras” → `sealed += N`
- Ajuste manual con motivo (registrar en `audit_log`)
- Sin historial de movimientos en v1

## Reembolso / cancelación (v1)

Reversión de stock **manual** por operador — incrementar sealed/loose en admin. Ledger automático → v2.

## Migración desde `stock_quantity`

Productos existentes (S1A):

```text
stock_sealed_packages = 0
stock_loose_base_units = stock_quantity  -- asumía bolsas sueltas
items_per_package = 1
prices.unit = prices.normal
```

## v2 (planificado)

| Feature                      | Tabla                                              |
| ---------------------------- | -------------------------------------------------- |
| Ledger movimientos           | `inventory.inventory_movements`                    |
| Fuente de verdad desacoplada | `inventory.inventory_items`                        |
| Trazabilidad por orden       | reason: sale, bundle_component, adjustment, return |

## API (planificada v1)

| Action                | Rol    | Descripción                        |
| --------------------- | ------ | ---------------------------------- |
| `adjustProductStock`  | admin  | Ajuste manual sealed/loose + audit |
| `checkOrderStock`     | server | Pre-confirmar pago                 |
| `deductStockForOrder` | server | Llamado al pasar a `paid`          |

## Tests obligatorios

- Venta producto simple decrementa unidades base (loose primero)
- Paquete parcialmente abierto: deduct deja sealed + loose correctos (Lay’s 25/50)
- Sorpresa con N componentes decrementa cada producto
- Stock insuficiente → rollback, orden no `paid`
- Ajuste manual incrementa/decrementa + normalización

## Reglas relacionadas

Reglas 4, 15, 18 en [`business-rules.md`](business-rules.md).

## Brief

- [S1D/01-products-packages-stock.md](stages/S1D/01-products-packages-stock.md)
- [S2A/01-stock-deduct-on-payment.md](stages/S2A/01-stock-deduct-on-payment.md)

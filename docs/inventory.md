# Inventory — De Tin Marín

> **v1:** stock en **`catalog.products`** como paquetes cerrados + unidades sueltas, con semántica distinta por `product_type`. Sin schema `inventory` ni ledger de movimientos hasta v2.

## Implementación por etapa

| Etapa         | Qué incluye                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| **S1A** ✅    | Columna `stock_quantity` (legacy)                                             |
| **S1D**       | `stock_sealed_packages` + `stock_loose_base_units`; drop `stock_quantity`     |
| **S2B / S2C** | Sin deduct ni validación de stock                                             |
| **S2A** ✅    | `confirm_payment_with_stock_deduct` + `checkOrderStock`                       |
| **fix**       | `product_type = unit` solo loose; líneas producto en presentaciones (`00014`) |

## Fuente de verdad (v1)

Columnas en `catalog.products` (DECISIONS #27, #29, Regla 4):

| Columna                  | Significado                             |
| ------------------------ | --------------------------------------- |
| `product_type`           | `'unit'` \| `'package'`                 |
| `stock_sealed_packages`  | Paquetes/tiras **cerrados**             |
| `stock_loose_base_units` | Unidades base sueltas (bolsas abiertas) |
| `items_per_package`      | Unidades base por presentación (`>= 1`) |

### Disponibilidad vendible

| `product_type` | Disponible para venta / deduct                        |
| -------------- | ----------------------------------------------------- |
| `package`      | `sealed × items_per_package + loose`                  |
| `unit`         | **solo** `stock_loose_base_units` (sealed no se abre) |

```text
# package
totalBaseUnits = stock_sealed_packages × items_per_package + stock_loose_base_units

# unit (vendible)
available = stock_loose_base_units
```

**Unidad base** = bolsa/unidad que consume cada sorpresa (`units_per_person` / `totalQuantity` en bundles).

### Normalización

Solo aplica de forma operativa a productos **`package`** tras ajuste o deduct:

```text
si stock_loose_base_units >= items_per_package:
  stock_sealed_packages += floor(loose / items_per_package)
  stock_loose_base_units = loose % items_per_package
```

En **`unit`**, el operador mueve inventario sealed → loose manualmente en admin si quiere liberar stock vendible.

### Display admin

Ejemplo Lay’s (`product_type = package`, `items_per_package = 10`, `package_label = "tira"`):

| sealed | loose | Display            | totalBaseUnits |
| ------ | ----- | ------------------ | -------------- |
| 5      | 0     | 5 tiras            | 50             |
| 2      | 5     | 2 tiras + 5 bolsas | 25             |

## Algoritmo de descuento (S2A — Regla 15)

### Agregación desde `shopping_cart`

| Origen                       | Campo en demanda       | Unidad                  |
| ---------------------------- | ---------------------- | ----------------------- |
| Línea `type: product`        | `presentationQuantity` | Presentaciones vendidas |
| Componente de línea `bundle` | `baseUnits`            | Unidades base           |

```text
need = presentationQuantity × items_per_package + baseUnits
```

### `package` — sealed/loose

Entrada: `need` = unidades base a consumir.

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

**Ejemplo:** 5 tiras (50 bolsas), pedido **3 presentaciones** (need=30) → quedan 2 tiras + 0 bolsas.

### `unit` — solo loose

```text
si stock_loose_base_units < need → INSUFFICIENT_STOCK
stock_loose_base_units -= need
# stock_sealed_packages NO se modifica
```

**Ejemplo:** sealed=50, loose=20, pedido 10 unidades → loose=10, sealed=50.

Implementación: `commerce.deduct_stock_for_order(p_order_id)` SECURITY DEFINER (migración `00014` alinea con shared), enganchada al confirmar pago.

Helpers compartidos en `@de-tin-marin/shared` (`product-stock`):

| Helper                            | Uso                                    |
| --------------------------------- | -------------------------------------- |
| `normalizeProductStock`           | Normalizar sealed/loose (package)      |
| `deductBaseUnits`                 | Algoritmo abrir paquetes (package)     |
| `deductUnitProductLoose`          | Solo loose (unit)                      |
| `deductProductStock`              | Dispatch por `productType`             |
| `resolveProductStockAvailability` | Disponibilidad vendible por tipo       |
| `checkOrderStock`                 | Simulación pre-pago (admin / checkout) |

SQL: `catalog._deduct_product_base_units`, `catalog._deduct_unit_product_loose`.

## Bundles / sorpresas

- **Sin stock propio** en `bundles`.
- Disponibilidad = mínimo de componentes según disponibilidad vendible de cada producto (Regla 4).
- Cantidades en snapshot de componentes = **unidades base** (`totalQuantity`).

## Admin (v1)

- Ver/editar `stock_sealed_packages` y `stock_loose_base_units` por producto
- Entrada alternativa: “Recibí N tiras” → `sealed += N` (luego normalizar si aplica)
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
product_type = 'unit'
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

- Venta producto `package`: presentaciones × `items_per_package`; loose primero, luego abrir sealed
- Producto `unit`: solo decrementa loose; sealed intacto aunque sea > 0
- Sorpresa con N componentes decrementa cada producto (base units)
- Stock insuficiente → rollback, orden no `paid`
- Ajuste manual incrementa/decrementa + normalización (`package`)

## Reglas relacionadas

Reglas 4, 15, 18, 21 en [`business-rules.md`](business-rules.md).

## Brief

- [S1D/01-products-packages-stock.md](stages/S1D/01-products-packages-stock.md)
- [S2A/01-stock-deduct-on-payment.md](stages/S2A/01-stock-deduct-on-payment.md)

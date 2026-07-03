# Orders — De Tin Marín

> **Responsabilidad:** ciclo de vida de la orden y snapshot de lo pedido. **NO** recalcula precios post-checkout.

## Qué se pide en una orden

Cada orden tiene **detalle** en dos niveles:

| Tipo línea           | Tabla                                 | Contenido                                                                              |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Producto individual  | `order_items` (`item_type = product`) | `product_id`, cantidad, precios congelados                                             |
| Sorpresa (bundle)    | `order_items` (`item_type = bundle`)  | `bundle_id` plantilla origen, cantidad de sorpresas, `service_fee`, precios congelados |
| Composición sorpresa | `order_bundle_items`                  | Snapshot: qué productos, cantidades, precios unitarios                                 |

### Ejemplo sorpresa personalizada

Plantilla base: productos 1–5, 25 sorpresas. Cliente modifica → productos 1,2,3,5,6,8 (reemplaza 4 por 8, agrega 6).

`order_items`: 1 fila bundle, `quantity = 25`, `service_fee` congelado.

`order_bundle_items`: 6 filas — cada una `quantity_per_unit = 1`, `total_quantity = 25`, `unit_price` del producto al momento del pedido.

## Estados

```text
Draft → Pending Payment → Paid → Preparing → Ready → Shipped → Delivered → Completed
                                                                              ↘ Cancelled
```

## Transiciones permitidas

| Desde             | Hacia                          |
| ----------------- | ------------------------------ |
| `draft`           | `pending_payment`, `cancelled` |
| `pending_payment` | `paid`, `cancelled`            |
| `paid`            | `preparing`, `cancelled`       |
| `preparing`       | `ready`, `cancelled`           |
| `ready`           | `shipped`, `cancelled`         |
| `shipped`         | `delivered`                    |
| `delivered`       | `completed`                    |

Cancelación post-pago y reembolso: **manual por operador** en v1 (Regla 18).

## Flujo de creación

1. Cliente arma carrito: productos sueltos y/o sorpresas personalizadas desde plantilla.
2. Backend calcula totales (Pricing) — preview.
3. Al confirmar → `pending_payment`: congelar `order_items`, `order_bundle_items`, `pricing_snapshot`.
4. Operador confirma pago manual → `paid` + `payments` + descuento stock (Regla 15).

## Pago manual (v1)

Sin pasarela. El operador en admin:

1. Registra/confirma en `commerce.payments`.
2. Cambia orden a `paid`.
3. Se ejecuta descuento de stock.

Ver Reglas 17–18.

## DTO de respuesta (cliente)

```typescript
type OrderItemDTO =
  | {
      type: "product";
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }
  | {
      type: "bundle";
      name: string;
      quantity: number;
      serviceFee: number;
      lineTotal: number;
      components: Array<{
        productName: string;
        totalQuantity: number;
      }>;
    };

type OrderDTO = {
  id: string;
  status: OrderStatus;
  total: number;
  currencyCode: "PEN";
  items: OrderItemDTO[];
  createdAt: string;
};
```

## Admin

- Listado y filtros por estado
- Detalle con composición de sorpresas
- Confirmar pago / marcar reembolso
- Avanzar estados operativos: preparing → ready → shipped

## Módulo

```text
src/modules/orders/
  services/order.service.ts
  services/order-transition.service.ts
  services/bundle-customization.service.ts
  actions/...
```

## Tests obligatorios

- Snapshot de sorpresa personalizada independiente de plantilla
- Transiciones ilegales rechazadas
- `paid` dispara deduct stock
- Totales no mutan post-checkout

## Reglas relacionadas

Reglas 13–18 en [`business-rules.md`](business-rules.md).

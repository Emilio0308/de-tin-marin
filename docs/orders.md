# Orders — De Tin Marín

> **Responsabilidad:** ciclo de vida de la orden y snapshot del carrito. **NO** recalcula precios post-checkout.

## Order shopping cart

El detalle del pedido vive en **`commerce.orders.shopping_cart`** (JSONB). No hay tablas `order_items` ni `order_bundle_items` en v1.

Al confirmar checkout se **congela** el carrito completo: productos sueltos y sorpresas (bundles) personalizadas, con precios y composición independientes de la plantilla.

### Estructura (`shopping_cart`)

```typescript
type OrderShoppingCart = {
  lines: ShoppingCartLine[];
};

type ShoppingCartLine =
  | {
      type: "product";
      productId: string;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }
  | {
      type: "bundle";
      bundleId: string;
      name: string;
      quantity: number;
      serviceFee: number;
      lineTotal: number;
      components: Array<{
        productId: string;
        productName: string;
        sku: string;
        quantityPerUnit: number;
        totalQuantity: number;
        unitPrice: number;
      }>;
    };
```

### Ejemplo sorpresa personalizada

Plantilla base: productos 1–5, 25 sorpresas. Cliente modifica → productos 1,2,3,5,6,8.

Una línea `type: "bundle"` con `quantity: 25`, `serviceFee` congelado y 6 `components`, cada uno con `quantityPerUnit: 1`, `totalQuantity: 25`, `unitPrice` del momento del pedido.

## Cabecera de la orden

| Campo                                                   | Tipo          | Notas                                                |
| ------------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `id`                                                    | uuid          | PK interna                                           |
| `order_number`                                          | text          | Legible, ej. `TM-20260703-0042`                      |
| `status`                                                | enum          | Ver estados abajo                                    |
| `payment_status`                                        | enum          | `pending` \| `confirmed` \| `refunded`               |
| `customer_id`                                           | uuid nullable | FK `crm.customers` — **después** (login ecommerce)   |
| `contact`                                               | jsonb         | Snapshot guest: `name`, `lastName`, `phone`, `email` |
| `fulfillment`                                           | jsonb         | `method`, `deliveryAddress`, `notes`                 |
| `shopping_cart`                                         | jsonb         | Order shopping cart congelado                        |
| `payment_methods`                                       | jsonb         | Array flexible; estructura interna → S2C/pasarela    |
| `subtotal`, `discount_total`, `shipping_total`, `total` | numeric       | Snapshots                                            |
| `pricing_snapshot`                                      | jsonb         | Desglose opcional al confirmar                       |
| `currency_code`                                         | text          | `'PEN'`                                              |
| `metadata`                                              | jsonb         | Extensiones futuras                                  |

### `fulfillment` (v1)

```json
{
  "method": "delivery",
  "deliveryAddress": {
    "recipientName": "María García",
    "line1": "Av. ... 123",
    "district": "Miraflores",
    "city": "Lima",
    "province": "Lima",
    "reference": "Edificio azul, dpto 4",
    "phone": "999888777"
  },
  "notes": ""
}
```

`method`: `"delivery"` \| `"pickup"`.

## Estados

Toda orden se crea en **`pending_payment`**. Sin estado `draft`.

```text
pending_payment → paid → preparing → ready → delivered → completed
                    ↘ cancelled
```

## Transiciones permitidas

| Desde             | Hacia                    |
| ----------------- | ------------------------ |
| `pending_payment` | `paid`, `cancelled`      |
| `paid`            | `preparing`, `cancelled` |
| `preparing`       | `ready`, `cancelled`     |
| `ready`           | `delivered`, `cancelled` |
| `delivered`       | `completed`              |

Cancelación post-pago y reembolso: **manual por operador** en v1 (Regla 18).

## Flujo de creación

1. Cliente arma carrito: productos sueltos y/o sorpresas personalizadas desde plantilla.
2. Backend calcula totales (Pricing) — preview.
3. Al confirmar → `pending_payment`: congelar `shopping_cart`, totales y `pricing_snapshot`.
4. Operador confirma pago manual → `paid` + `payment_methods` / `commerce.payments` (S2C).
5. Descuento de stock al pasar a `paid` (Regla 15) → **S2A**, leyendo `shopping_cart.lines`.

## Pago manual (v1)

Sin pasarela. El operador en admin:

1. Registra/confirma pago (`payment_methods` y/o `commerce.payments`).
2. Cambia orden a `paid` y `payment_status` a `confirmed`.
3. _(S2A)_ Se ejecuta `deduct_stock_for_order`.

Hasta S2A, el operador puede revisar/ajustar `stock_sealed_packages` / `stock_loose_base_units` manualmente en admin (ver [inventory.md](inventory.md)).

Ver Reglas 17–18.

## DTO de respuesta

```typescript
type OrderDTO = {
  orderId: string;
  customer: {
    uid: string | null;
    name: string;
    lastName: string;
    phone: string;
    email: string;
  };
  fulfillment: FulfillmentDTO;
  shoppingCart: OrderShoppingCart;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethods: unknown[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  currencyCode: "PEN";
  metadata: Record<string, unknown>;
  createdAt: string;
};
```

## Admin

- Listado y filtros por estado
- Detalle con composición de sorpresas desde `shopping_cart`
- Confirmar pago / marcar reembolso
- Avanzar estados: preparing → ready → delivered → completed

## Módulo

```text
src/modules/orders/
  services/order.service.ts
  services/order-transition.service.ts
  services/bundle-customization.service.ts
  actions/...
```

## Tests obligatorios

- Snapshot de sorpresa personalizada independiente de plantilla en `shopping_cart`
- Transiciones ilegales rechazadas
- Totales no mutan post-checkout
- `paid` dispara deduct stock (leyendo `shopping_cart`) → **S2A**

## Reglas relacionadas

Reglas 13–18 en [`business-rules.md`](business-rules.md).

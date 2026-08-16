# Orders — De Tin Marín

> **Responsabilidad:** ciclo de vida de la orden y snapshot del carrito. **NO** recalcula precios post-checkout.

## Order shopping cart

El detalle del pedido vive en **`commerce.orders.shopping_cart`** (JSONB). No hay tablas `order_items` ni `order_bundle_items` en v1.

Al confirmar checkout se **congela** el carrito completo: productos sueltos, sorpresas (bundles) personalizadas y **packs/combos**, con precios y composición independientes de la plantilla.

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
      /** Presentaciones (tiras/paquetes). */
      packageQuantity: number;
      /** Unidades base sueltas; tras normalize: unitQuantity < items_per_package. */
      unitQuantity: number;
      /** Precio por presentación (final). */
      packagePrice: number;
      /** Precio por unidad base (finalUnitPrice). */
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
        /** Unidades base consumidas (Regla 15). */
        totalQuantity: number;
        unitPrice: number;
      }>;
    }
  | {
      type: "pack";
      packId: string;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      components: Array<{
        productId: string;
        productName: string;
        sku: string;
        packageQuantity: number;
        unitQuantity: number;
        /** Presentaciones a descontar = packageQuantity × line.quantity. */
        totalPackages: number;
        /** Unidades base a descontar = unitQuantity × line.quantity. */
        totalUnits: number;
      }>;
    };
```

Al descontar stock (Regla 15 / DECISIONS #27 / #29 / #33): líneas producto aportan `presentationQuantity` (`packageQuantity`) **y** `baseUnits` (`unitQuantity`); componentes de pack aportan `presentationQuantity` (`totalPackages`) **y** `baseUnits` (`totalUnits`); componentes de bundle aportan `baseUnits`. `need = presentationQuantity × items_per_package + baseUnits`, con deduct distinto por `product_type`. Al congelar, si `unitQuantity >= items_per_package` se normaliza a paquetes (`packageQuantity += floor(unitQuantity / ipp)`).

### Línea `type: product` — dual package + unit (DECISIONS #27)

Migración `00024_product_line_dual_quantity.sql`. Reemplaza el campo legacy `quantity` (solo presentaciones).

| Campo             | Significado                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `packageQuantity` | Presentaciones vendidas (tiras/paquetes/cajas según `product_type`) |
| `unitQuantity`    | Unidades base sueltas (bolsas)                                      |
| `packagePrice`    | Precio final por presentación (`finalPrice` / `presentationPrice`)  |
| `unitPrice`       | Precio final por unidad base (`finalUnitPrice`)                     |
| `lineTotal`       | `packagePrice × packageQuantity + unitPrice × unitQuantity`         |

**Invariantes (Zod + shared):**

1. `packageQuantity >= 0`, `unitQuantity >= 0`, **`packageQuantity + unitQuantity >= 1`**.
2. Al build (`normalizeProductLineQuantities` en `@de-tin-marin/shared/order-cart`):
   - `packageQuantity += floor(unitQuantity / items_per_package)`
   - `unitQuantity = unitQuantity % items_per_package`
   - Tras normalize: `unitQuantity < items_per_package`.
3. Demanda stock: `needBase = packageQuantity × ipp + unitQuantity` (`productLineNeedBaseUnits`).

**Canal:**

| Canal                     | Regla                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin** (`/orders/new`) | Puede vender presentaciones **y** unidades base. Steppers duales en UI. Techo: `needBase ≤ stockTotalBaseUnits` vía `clampProductDualQuantities`. Productos `product_type = unit`: solo el stepper de presentaciones (equivale a unidades). Salta `purchase_min/max` (Regla 21). |
| **Ecommerce / guest**     | Solo presentaciones: **`unitQuantity = 0` siempre** (carrito localStorage + checkout). Sigue Regla 21 (min/max + stock en presentaciones).                                                                                                                                       |

Ejemplo admin Lay’s (`ipp = 10`): pedido 2 tiras + 7 bolsas → congelado `packageQuantity: 2`, `unitQuantity: 7`. Pedido 2 tiras + 15 bolsas → normaliza a `packageQuantity: 3`, `unitQuantity: 5`.

Helpers canónicos: `buildProductLine`, `normalizeProductLineQuantities`, `computeOrderTotals`, `deriveAdjustmentsFromFinalPrice` en `@de-tin-marin/shared/order-cart`; clamp admin en `@de-tin-marin/shared/product-purchase-limits`.

### Sorpresa personalizada: límites por plantilla

Cada línea `type: "bundle"` debe respetar la cardinalidad configurada en su
plantilla (`catalog.bundles.customization_min_products` /
`customization_max_products`), no un límite global.

- Valores por defecto e históricos: **8** productos distintos como mínimo y
  **20** como máximo.
- El rango válido es `1 ≤ min ≤ max ≤ 100`; `100` es un techo de aplicación
  contra abuso.
- La composición base de `bundle_items` también debe caber en ese rango:
  no se puede guardar una plantilla cuyo estado inicial sea inválido.
- Se valida en el wizard ecommerce, en el preview del order-form admin y de
  nuevo al crear la orden. La validación exige IDs de producto únicos y
  cantidades por componente positivas.
- Las órdenes ya creadas conservan su `shopping_cart` congelado: cambiar los
  límites de una plantilla no altera ni invalida snapshots históricos.

`resolveBundleCustomizationBounds` y
`validateBundleCustomization(components, bounds)` en
`@de-tin-marin/validations/customize-bundle` son los contratos canónicos.

### Ejemplo sorpresa personalizada

Plantilla base: productos 1–5, 25 sorpresas. Cliente modifica → productos 1,2,3,5,6,8.

Una línea `type: "bundle"` con `quantity: 25`, `serviceFee` congelado y 6 `components`, cada uno con `quantityPerUnit: 1`, `totalQuantity: 25`, `unitPrice` del momento del pedido.

## Cabecera de la orden

| Campo                                                                      | Tipo                                                                                                                                      | Notas                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `id`                                                                       | uuid                                                                                                                                      | PK interna                                           |
| `order_number`                                                             | text                                                                                                                                      | Legible, ej. `TM-20260703-0042`                      |
| `status`                                                                   | enum                                                                                                                                      | Ver estados abajo                                    |
| `payment_status`                                                           | enum                                                                                                                                      | `pending` \| `confirmed` \| `refunded`               |
| `customer_id`                                                              | uuid nullable                                                                                                                             | FK `crm.customers` — **después** (login ecommerce)   |
| `contact`                                                                  | jsonb                                                                                                                                     | Snapshot guest: `name`, `lastName`, `phone`, `email` |
| `fulfillment`                                                              | jsonb                                                                                                                                     | `method`, `deliveryAddress`, `notes`                 |
| `shopping_cart`                                                            | jsonb                                                                                                                                     | Order shopping cart congelado                        |
| `payment_methods`                                                          | jsonb                                                                                                                                     | Array flexible; estructura interna → S2C/pasarela    |
| `subtotal`, `discount_total`, `surcharge_total`, `shipping_total`, `total` | Snapshots. Fórmula abajo. Ajuste de cabecera **admin-only** (no recalcula precios de línea). Migración `00023_order_surcharge_total.sql`. |
| `pricing_snapshot`                                                         | jsonb                                                                                                                                     | Desglose opcional al confirmar                       |
| `currency_code`                                                            | text                                                                                                                                      | `'PEN'`                                              |
| `metadata`                                                                 | jsonb                                                                                                                                     | Extensiones futuras                                  |

### Totales de cabecera

```text
total = subtotal − discount_total + shipping_total + surcharge_total
```

| Campo             | Quién lo setea            | Notas                             |
| ----------------- | ------------------------- | --------------------------------- |
| `subtotal`        | Backend al crear          | Σ `lineTotal` del `shopping_cart` |
| `shipping_total`  | Delivery zones / pickup=0 | No se recalcula post-checkout     |
| `discount_total`  | Admin (y 0 en guest)      | `>= 0`                            |
| `surcharge_total` | **Solo admin**            | `>= 0`; guest siempre `0`         |
| `total`           | Backend                   | Fórmula anterior; snapshot        |

**Admin — UI Totales (`order-form`):**

| Tab                     | Comportamiento                                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Precio final**        | El operador ingresa el **total a cobrar** (incluye envío). Shared `deriveAdjustmentsFromFinalPrice({ subtotal, shippingTotal, finalTotal })` calcula **XOR**: si `final < subtotal+shipping` → solo `discount`; si `final > base` → solo `surcharge`; si igual → ambos 0. |
| **Descuento / recargo** | Inputs independientes; **pueden coexistir** (p. ej. descuento 5 + recargo 2).                                                                                                                                                                                             |

Los ajustes **no** mutan `packagePrice` / `unitPrice` / `lineTotal` de las líneas (Regla 16).

**Ejemplo (admin):** `subtotal = 100`, `shipping = 10` → base = 110.

| Acción operador             | Resultado cabecera                                        |
| --------------------------- | --------------------------------------------------------- |
| Tab Precio final = 100      | `discountTotal = 10`, `surchargeTotal = 0`, `total = 100` |
| Tab Precio final = 130      | `discountTotal = 0`, `surchargeTotal = 20`, `total = 130` |
| Tab Descuento=5 + Recargo=2 | ambos persistidos; `total = 100 − 5 + 10 + 2 = 107`       |

**Ecommerce / guest:** `discountTotal = 0`, `surchargeTotal = 0` en create/preview.

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

1. Cliente/admin arma carrito: productos (dual qty en admin; solo presentaciones en ecommerce), packs y/o sorpresas personalizadas.
2. Backend preview: `buildShoppingCart` + `computeOrderTotals` (Pricing congelable).
3. Al confirmar → `pending_payment`: congelar `shopping_cart`, `subtotal` / `discount_total` / `surcharge_total` / `shipping_total` / `total` y `pricing_snapshot`.
4. Operador confirma pago manual → `paid` + `payment_methods` / `commerce.payments` (S2C).
5. Descuento de stock al pasar a `paid` (Regla 15) → **S2A**, leyendo `shopping_cart.lines` (product dual + pack dual + bundle base).

### Input create / preview (Zod)

`@de-tin-marin/validations/order`:

```typescript
// Línea producto (createOrderInputSchema / previewOrderCartInputSchema)
{
  type: "product";
  productId: uuid;
  packageQuantity: int >= 0;
  unitQuantity: int >= 0;
}
// refine: packageQuantity + unitQuantity >= 1

// Cabecera
{
  (shippingTotal, discountTotal, surchargeTotal);
} // todos >= 0; guest surcharge=0
```

## Pago manual (v1)

Sin pasarela. El operador en admin:

1. Registra/confirma pago (`payment_methods` y/o `commerce.payments`).
2. Cambia orden a `paid` y `payment_status` a `confirmed`.
3. Se ejecuta `commerce.confirm_payment_with_stock_deduct` (deduct atómico + `paid`).
4. Si falta stock de producto o envase → orden permanece `pending_payment`.

Ver Reglas 17–18. Reversión de stock en reembolso: manual (Regla 18).

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
  surchargeTotal: number;
  shippingTotal: number;
  total: number;
  currencyCode: "PEN";
  metadata: Record<string, unknown>;
  createdAt: string;
};
```

## Admin

- Listado SSR + filtros por estado (pageSize default 5)
- Detalle: composición pack/bundle desde `shopping_cart`; muestra `surchargeTotal`
- **Crear orden (`/orders/new`):**
  - Tabs catálogo: productos (picker + dual qty), combos, sorpresas
  - Líneas product: steppers presentación + unidad (si `product_type = package`); clamp `needBase ≤ availableBase`
  - Líneas pack/bundle: composición desplegable (`viewComponents`)
  - Totales: tabs Precio final (XOR) y Descuento/recargo; ver § Totales de cabecera
  - Validación cliente: `helpers/order-form-validation.ts` → `createOrderInputSchema` + mensajes de campo
- Confirmar pago / marcar reembolso
- Avanzar estados: preparing → ready → delivered → completed

Detalle de módulo: [`apps/admin/src/modules/orders/README.md`](../apps/admin/src/modules/orders/README.md).

## Ecommerce

- Carrito localStorage: líneas product siempre `unitQuantity: 0`; cantidad = `packageQuantity`
- Checkout guest: `surchargeTotal = 0`; input Zod dual con `unitQuantity: 0`
- Confirmación / lookup guest: DTO incluye `surchargeTotal` (0)

## Módulo

```text
src/modules/orders/          # admin
  services/order.service.ts
  services/order-preview.service.ts
  helpers/order-form-validation.ts
  components/order-form/
  components/order-detail/
apps/ecommerce/.../cart|checkout|orders
packages/shared/order-cart.ts
packages/shared/product-purchase-limits.ts
packages/validations/order.ts
```

## Tests obligatorios

- Snapshot de sorpresa personalizada independiente de plantilla en `shopping_cart`
- Product dual: normalize `unitQuantity >= ipp` → paquetes; `lineTotal` con ambos precios
- Admin clamp dual `needBase ≤ availableBase`; ecommerce `unitQuantity = 0`
- `deriveAdjustmentsFromFinalPrice` (discount XOR surcharge)
- Transiciones ilegales rechazadas
- Totales no mutan post-checkout (Regla 16)
- `paid` dispara deduct (product `packageQuantity`/`unitQuantity` + pack dual + bundle) → **S2A**
- Migraciones `00023` / `00024` + pgTAP `commerce__orders` / `commerce__deduct_stock` / guest

## Reglas relacionadas

Reglas 4, 13–18, 21, 24–25 en [`business-rules.md`](business-rules.md) · DECISIONS #26, #27, #29, #31, #33.

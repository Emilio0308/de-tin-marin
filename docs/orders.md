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

### Sorpresa personalizada: cantidad de línea ecommerce

`bundles.quantity` es la **cantidad de sorpresas** definida en la plantilla
(default al personalizar). En la orden, esa cantidad queda en
`shopping_cart.lines[].quantity` para una línea `type: "bundle"`.

| Canal                                  | Regla de `quantity`                                                                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plantilla (`catalog.bundles.quantity`) | Entero `>= 1`; default de cuántas sorpresas arma esa plantilla.                                                                                                                                          |
| Ecommerce / guest (`line.quantity`)    | Entero **15–100**. El wizard inicia con `clamp(bundles.quantity, 15, 100)` (DTO: `personCount` = ese valor), permite cambiarlo y hace preview con el elegido. Checkout vuelve a rechazar fuera de rango. |
| Admin order-form                       | Entero `>= 1`; no aplica el rango 15–100.                                                                                                                                                                |

El rango ecommerce de cantidad de sorpresas es independiente de los límites de
productos distintos de la plantilla. Precio, componentes y envase se congelan
en la línea al agregar al carrito; cada unidad de `line.quantity` consume un
envase y las unidades base de todos los componentes.

Constantes: `BUNDLE_LINE_QUANTITY_MIN = 15` y
`BUNDLE_LINE_QUANTITY_MAX = 100` en
`@de-tin-marin/validations/customize-bundle`.

### Ejemplo sorpresa personalizada

Plantilla: productos 1–5, `bundles.quantity = 25` sorpresas. Cliente modifica
composición → productos 1,2,3,5,6,8 y deja cantidad 30.

Línea `type: "bundle"` con `quantity: 30`, `container` congelado y 6
`components`. Si cada dulce queda en `quantityPerUnit: 1`,
`totalQuantity: 30` por componente; si el cliente sube un dulce a
`quantityPerUnit: 2` (flag `enableUnitsPerPerson`), ese componente congela
`totalQuantity: 60`. `unitPrice` = final del momento del preview.

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
  "method": "pickup_point",
  "pickupPoint": {
    "id": "uuid",
    "name": "Real Plaza Piura",
    "lat": -5.19,
    "lng": -80.63,
    "fee": 6.0
  },
  "notes": ""
}
```

`method`: `"delivery"` \| `"pickup"` \| `"pickup_point"`.

- **`pickup`** — recojo en tienda (admin manual; sin dirección ni punto;
  `shipping_total = 0`).
- **`pickup_point`** — punto de recojo externo. Snapshot
  `{ id, name, lat, lng, fee }` congelado al crear (Regla 30). Guest no
  envía `deliveryAddress` ni `mapPin`. El fee se rehidrata desde
  `pricing.pickup_points` (activo); mismatch → no se crea la orden.
- **`delivery`** — dirección + `metadata.mapPin` (guest). Sin `pickupPoint`.

Checkout ecommerce muestra `pickup_point` solo si
`listCheckoutPickupPointsAction` devuelve puntos (kill switch on y hay
activos). Recojo en tienda sigue oculto (`storeFeatures.pickupEnabled`).

## Estados

Toda orden se crea en **`pending_payment`**. Sin estado `draft`.

```text
pending_payment → paid → preparing → ready
                                      ├─ pickup        → awaiting_pickup → delivered → completed
                                      ├─ pickup_point  → in_transit      → delivered → completed
                                      └─ delivery      → in_transit      → delivered → completed
                    ↘ cancelled (hasta in_transit / awaiting_pickup inclusive)
```

- **`awaiting_pickup`:** solo `fulfillment.method = pickup` (recojo en tienda). Sin panel de envío.
- **`in_transit`:** `delivery` o `pickup_point`. Al pasar desde `ready` exige carrier + tracking en `commerce.shipments` (`status: shipped`).
- **`delivered`:** el cliente **ya tiene** el producto (ambos canales).

## Transiciones permitidas

| Desde             | Hacia                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `pending_payment` | `paid`, `cancelled`                                                                              |
| `paid`            | `preparing`, `cancelled`                                                                         |
| `preparing`       | `ready`, `cancelled`                                                                             |
| `ready`           | `awaiting_pickup` (solo pickup), `in_transit` (delivery \| pickup_point + shipment), `cancelled` |
| `awaiting_pickup` | `delivered`, `cancelled`                                                                         |
| `in_transit`      | `delivered`, `cancelled`                                                                         |
| `delivered`       | `completed`                                                                                      |

Cancelación post-pago: refund + restock **atómicos** (Regla 18 / DECISIONS #41–#42 / [S4-09](stages/S4/09-cancel-atomic-restock.md)).

Migración estados logísticos: `00030` · DECISIONS **#42** · brief [S4-10](stages/S4/10-order-status-in-transit-awaiting-pickup.md).

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

Ver Reglas 17–18. Cancelación post-pago: refund + restock atómicos vía `commerce.cancel_order_with_restock` (Regla 18 / DECISIONS #41 / [S4-09](stages/S4/09-cancel-atomic-restock.md)).

### Cancelación atómica (v1)

Punto de entrada único: **Cancelar** en admin (`cancelOrderAction`).

| Estado origen                                                     | Efecto                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `pending_payment`                                                 | Solo `status = cancelled`                                  |
| `paid` / `preparing` / `ready` / `awaiting_pickup` / `in_transit` | RPC atómica: payments → `refunded` + restock + `cancelled` |
| `delivered` / `completed`                                         | Rechazado (`INVALID_TRANSITION`)                           |

Reintento sobre orden ya `cancelled`: OK idempotente, sin segundo restock.

### Instrucciones de pago dinámicas (ecommerce)

Mientras una orden guest esté en `pending_payment`, las páginas de
confirmación y consulta muestran instrucciones construidas desde
`core.public_business_settings`:

- Yape: teléfono y titular.
- Transferencia: banco, titular, número de cuenta y CCI.
- La fuente también abastece WhatsApp/email de contacto en el FAB de ayuda,
  Nosotros, Términos y Privacidad.

El DTO público es una allowlist (`PublicBusinessSettings`) validada con
`@de-tin-marin/validations/business-settings`; no se expone una fila cruda.
La confirmación obtiene la configuración mediante React Query con
`queryKeys.businessSettings.public()` y `staleTime` de 5 min. El contenido se
lee al mostrar la página: **no se snapshottea en la orden**. Por eso una
actualización staff puede cambiar las instrucciones visibles de órdenes
pendientes ya creadas.

Ver instrucciones no registra un pago, no altera `payment_status` y no
sustituye la confirmación manual/admin + RPC atómica de stock.

### Notificación email al crear una orden

Tras persistir una orden, create-order **await** un envío SMTP **best-effort**
vía `@de-tin-marin/notifications` (sin `after()`). El correo ocurre en el
mismo request y puede alargar la latencia; la orden ya guardada sigue
devolviendo `{ ok: true }` aunque falte SMTP o falle uno de los envíos.

| Origen de creación | Destinatarios                                                                     |
| ------------------ | --------------------------------------------------------------------------------- |
| Ecommerce / guest  | Cliente + correo operativo de `core.public_business_settings` + extras opcionales |
| Admin              | Correo operativo + extras opcionales; nunca el cliente                            |

El paquete recibe un `OrderCreatedNotifyInput` allowlist: identificadores,
totales, contacto, líneas ya congeladas y resumen de fulfillment. Genera
plantillas HTML (constantes en `*.template.ts`, embebidas en el bundle — **no**
`readFileSync` de `.html` sueltos) y texto plano; el correo cliente incluye
enlaces opcionales a confirmación/Mis pedidos y el administrativo al detalle
de admin. Las URLs se construyen solo si las bases server-side están
configuradas.

SMTP es configuración exclusivamente server-side (`SMTP_*`); el transporte usa
puerto **587** y `secure: false`. Si falta host/user/pass/from se omite el
envío y se registra `SMTP_NOT_CONFIGURED`. Los destinatarios extra se leen de
`ORDER_NOTIFY_EXTRA_EMAILS`, se validan y deduplican sin distinguir
mayúsculas. Los logs contienen `notify_start` / `notified` /
`NOTIFY_FAILED` con solo `orderId`/`orderNumber`, origen, conteo enviado y
código de fallo: nunca contacto, dirección, carrito ni credenciales SMTP.

No hay outbox, reintentos ni webhook en v1. Por lo tanto la notificación no es
una garantía de entrega ni un sustituto del lookup guest por número de orden +
email.

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
  - Fulfillment: `delivery` \| `pickup` \| `pickup_point` (selector de puntos)
  - Líneas product: steppers presentación + unidad (si `product_type = package`); clamp `needBase ≤ availableBase`
  - Líneas pack/bundle: composición desplegable (`viewComponents`)
  - Totales: tabs Precio final (XOR) y Descuento/recargo; ver § Totales de cabecera
  - Validación cliente: `helpers/order-form-validation.ts` → `createOrderInputSchema` + mensajes de campo
- Confirmar pago
- Cancelar (`pending_payment` \| `paid` \| `preparing` \| `ready`): post-pago = refund + restock atómicos
- Avanzar estados: preparing → ready → (awaiting_pickup \| in_transit) → delivered → completed

Detalle de módulo: [`apps/admin/src/modules/orders/README.md`](../apps/admin/src/modules/orders/README.md).

## Ecommerce

- Carrito localStorage: líneas product siempre `unitQuantity: 0`; cantidad = `packageQuantity`
- Checkout guest: `surchargeTotal = 0`; `method` = `delivery` \| `pickup_point`;
  input Zod dual con `unitQuantity: 0`
- Confirmación / lookup guest: DTO incluye `surchargeTotal` (0) y snapshot
  `fulfillment.pickupPoint` si aplica

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

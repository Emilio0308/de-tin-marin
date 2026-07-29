# S3A-3 · Carrito y checkout

|                |                                                                   |
| -------------- | ----------------------------------------------------------------- |
| **Etapa**      | S3A-3 — Carrito + checkout ([roadmap.md](../../roadmap.md) § S3A) |
| **Owner**      | Equipo De Tin Marín                                               |
| **App(s)**     | `apps/ecommerce`, `packages/shared`, `supabase`                   |
| **Schemas**    | `catalog`, `commerce`, `pricing`                                  |
| **Depende de** | S3A-2 ✅ (brief), [S3A-0](00-ecommerce-foundation.md)             |
| **Estado**     | draft                                                             |

## Contexto (leer esto, no todo docs/)

- Carrito v1: **localStorage** con interfaz `CartRepository` intercambiable (futuro `customer_id` / sesión S4).
- Checkout crea orden `pending_payment` — DECISIONS #8 sin pasarela.
- **Regla 19** — delivery: tarifa por distrito Piura o `fallback_fee`; pickup desactivado v1 (`pickupEnabled=false`).
- **Regla 15** — stock: `strictStockValidationOnCheckout=false` → warnings; `true` → rechazar submit.
- Hoy `commerce.orders` RLS = **solo staff** → migración con **política guest INSERT** (+ SELECT limitado o RPC lookup en S3A-4).
- Mapa: proveedor **gratuito** (recomendado **Leaflet + OpenStreetMap**); pin guarda `lat`/`lng` + texto referencia en `fulfillment` / `metadata` — **no** geocoding de pago por ahora.
- Cobertura: **solo Piura** — si pin/distrito fuera de cobertura → **bloquear** checkout (sin `fallback_fee` automático fuera de zona).

## Objetivo

El cliente agrega productos y/o sorpresas personalizadas al carrito, completa checkout con contacto y ubicación en mapa (Piura), ve delivery calculado y crea orden `pending_payment` con snapshot congelado.

## Scope IN

### Carrito (`/carrito`)

- Abstracción:

```typescript
interface CartRepository {
  getLines(): CartLine[];
  addLine(line: CartLine): void;
  updateLine(id: string, patch: Partial<CartLine>): void;
  removeLine(id: string): void;
  clear(): void;
}
// v1: localStorageCartRepository
// v2: customerSessionCartRepository (S4)
```

- Líneas: `type: 'product' | 'bundle'` — bundle lleva `components` + `container` congelados del wizard
- Totales en cliente vía `computeOrderTotals` (validar de nuevo en server al submit)
- Rutas: `/carrito`, acciones editar cantidad producto, eliminar línea

### Checkout (`/checkout`)

- Formulario: nombre, apellido, teléfono, email (Zod `orderContactSchema`)
- Delivery único v1 (`method: 'delivery'`); pickup oculto si `pickupEnabled=false`
- Dirección: línea, distrito (select zonas Piura seed S1E), ciudad, provincia, referencia
- **Mapa Leaflet/OSM:** pin arrastrable; guardar `{ lat, lng }` en `fulfillment.metadata` o `deliveryAddress`
- Validación cobertura:
  - Distrito debe existir en `pricing.delivery_zones` activas **o** estar dentro de bounding box Piura acordado
  - Si fuera → mensaje “sin cobertura”, **botón submit disabled**
- `shipping_total` = `resolveDeliveryFee(district)` (mismo helper S1E)
- Stock: banner warnings; si `strictStockValidationOnCheckout` → service retorna `INSUFFICIENT_STOCK` y no crea orden
- Server Action `createGuestOrder` — reutiliza lógica extraída S3A-0 (mismo path que admin `createOrderService`)

### Migración `00011_guest_orders_rls.sql` (nombre provisional)

- Política **`orders_insert_guest`**:
  - `INSERT` para `anon, authenticated`
  - `WITH CHECK`: `status = 'pending_payment'`, `payment_status = 'pending'`, `customer_id IS NULL`
  - Campos obligatorios validados por trigger o CHECK mínimo
- **NO** `UPDATE`/`SELECT` amplio para anon — consulta pedido en S3A-4 vía RPC
- pgTAP — guest puede insert; guest no puede leer todas las órdenes

### Feature flags (recap)

| Flag                              | v1      | Efecto               |
| --------------------------------- | ------- | -------------------- |
| `pickupEnabled`                   | `false` | Oculta opción recojo |
| `strictStockValidationOnCheckout` | `false` | Solo warnings        |
| `enableUnitsPerPerson`            | `false` | (wizard)             |

## Scope OUT (traps)

- **NO pasarela / cobro online** → operador confirma S2C
- **NO login** → S4
- **NO pickup UI** si flag false
- **NO fallback_fee fuera de Piura** — bloqueo total
- **NO Google Maps de pago** — solo OSM gratis
- **NO reserva de stock** al crear orden
- **NO cupones / descuentos** → S4
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)           | ¿Nueva? | Ops    | Política                        | pgTAP                        |
| ------------------------ | ------- | ------ | ------------------------------- | ---------------------------- |
| `commerce.orders`        | alter   | INSERT | `orders_insert_guest` anon/auth | `commerce__guest_orders.sql` |
| `pricing.delivery_zones` | —       | SELECT | Público activos (ya S1E)        | —                            |

## Boundaries y DTOs

| Boundary                     | Tipo          | Input                                | Output                      |
| ---------------------------- | ------------- | ------------------------------------ | --------------------------- |
| `createGuestOrder`           | Server Action | `createOrderInputSchema` + `mapPin?` | `{ id, orderNumber }`       |
| `resolveCheckoutDeliveryFee` | Action        | `{ district }`                       | `{ fee, covered: boolean }` |
| `checkCartStock`             | Action        | cart lines                           | `OrderStockCheckResult`     |

Errores: `VALIDATION`, `PRODUCT_NOT_FOUND`, `BUNDLE_NOT_FOUND`, `OUT_OF_COVERAGE`, `INSUFFICIENT_STOCK` (si strict).

## Rules que aplican

- Reglas **3, 7, 8, 13, 15, 16, 19, 20**
- DECISIONS **#8, #26**
- [`orders.md`](../../orders.md), [`pricing.md`](../../pricing.md)

## Orden de implementación

1. Migración RLS guest + pgTAP
2. `CartRepository` localStorage + tipos
3. Página carrito
4. Checkout form + mapa + cobertura
5. `createGuestOrder` service (shared core)
6. Redirect → S3A-4 confirmación
7. Playwright `checkout-smoke.spec.ts`
8. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] Agregar producto y sorpresa personalizada al carrito persiste en refresh
- [ ] Checkout con distrito Piura válido → `shipping_total` correcto
- [ ] Pin/distrito fuera de cobertura → no se puede enviar
- [ ] Orden creada en DB: `pending_payment`, `shopping_cart` congelado, `customer_id` null
- [ ] Admin ve la orden en listado
- [ ] `strictStockValidationOnCheckout=false` permite crear con warning
- [ ] `pickupEnabled=false` → sin opción pickup
- [ ] Playwright — happy path carrito → checkout → confirmación URL
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- **Bounding box Piura:** definir en implementación (constante en shared o polígono simple) — cerrar en PR con coordenadas acordadas.

## Depends on

- [02-bundle-customization-wizard.md](02-bundle-customization-wizard.md)
- [S1E/01-surprise-containers-delivery.md](../S1E/01-surprise-containers-delivery.md)
- [S2B/01-orders.md](../S2B/01-orders.md)

## Bloquea

- S3A-4 (confirmación y lookup)

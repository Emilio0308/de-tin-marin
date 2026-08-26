# S4-12 · Storefront settings (reglas generales de tienda)

|                |                                                 |
| -------------- | ----------------------------------------------- |
| **Etapa**      | S4 — Completitud / storefront                   |
| **Owner**      | Equipo De Tin Marín                             |
| **App(s)**     | `apps/admin`, `apps/ecommerce`                  |
| **Schemas**    | `core`, `pricing` (solo lectura fees base)      |
| **Depende de** | S1E delivery ✅, S3A-3 checkout ✅, S4-08/11 ✅ |
| **Estado**     | done                                            |

## Contexto

- Contacto/pagos viven en `core.public_business_settings`.
- Tarifas y métodos activos viven en `pricing.delivery_*` / pickup / courier.
- Faltaba una capa de **reglas de tienda** (promo envío, mínimo de pedido,
  aviso) sin meter fees de zona en 0 ni mezclar con contacto.

## Objetivo

Staff configura `core.storefront_settings` en `/storefront-settings`. Checkout
guest aplica overlay de fee, valida pedido mínimo sobre `subtotal` y muestra
aviso. Admin order-form aplica overlay de fee pero **no** el mínimo.

## Scope IN

- Tabla `core.storefront_settings` + seed `default` + RLS + pgTAP
- Shared: `isFreeFulfillmentActive`, `applyStorefrontShippingFee`,
  `assertMinOrderSubtotal`, `getActiveAnnouncement`
- Validations Zod update/DTO
- Admin CRUD singleton + nav + i18n
- Ecommerce: fee overlay, `ORDER_BELOW_MINIMUM`, banner; admin fee overlay

## Scope OUT (traps)

- **NO** cupones / códigos promocionales
- **NO** varias promos concurrentes ni historial de campañas de envío
- **NO** mínimo por método o por distrito
- **NO** poner fees de `delivery_zones` / `pickup_points` en 0 en DB
- **NO** reutilizar `pricing.campaigns` (solo % producto/pack)
- **NO** meter estos campos en `delivery_settings` o `public_business_settings`
- **NO** relajar `purchase_min_quantity` por producto (Regla 21)
- **NO** bloquear admin order-form por `min_order_subtotal`

## Tablas y RLS

| Tabla / objeto             | ¿Nueva? | Ops                          | Política               | Test                            |
| -------------------------- | ------- | ---------------------------- | ---------------------- | ------------------------------- |
| `core.storefront_settings` | sí      | SELECT público; UPDATE staff | `using (true)` / staff | `core__storefront_settings.sql` |

## DTO allowlist (público)

```ts
{
  freeDelivery: boolean;
  freePickupPoint: boolean;
  freeFulfillmentStartsAt: string | null;
  freeFulfillmentEndsAt: string | null;
  minOrderSubtotal: number;
  announcementEnabled: boolean;
  announcementMessage: string | null;
}
```

## Rules que aplican

- Regla 32 · DECISIONS #44
- Reglas 19/30/31 (fulfillment base; overlay encima)
- `docs/rules/00-architecture.md`, `40-validation-and-boundaries.md`,
  `85-react-components.md`

## Criterios de aceptación

- Staff activa `free_delivery` (+ ventana opcional) → checkout delivery S/ 0;
  fees de zona intactas en admin delivery
- Idem `free_pickup_point`
- Fuera de ventana / flags off → fee base
- `min_order_subtotal = 50` → guest subtotal 40 falla; ≥ 50 OK; admin no bloquea
- Anuncio enabled → visible en checkout; disabled/vacío → no
- Tests: `packages/shared/src/storefront-settings.test.ts`,
  `supabase/tests/core__storefront_settings.sql`, checkout presentational
- `pnpm check` + `pnpm build`

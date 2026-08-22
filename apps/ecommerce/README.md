# Ecommerce — De Tin Marín

App Next.js de la tienda pública (`apps/ecommerce`).

## Estructura de módulos

```
src/modules/
  catalog/    # Listados públicos productos, sorpresas, combos
  cart/       # Carrito cliente (S3A-3)
  checkout/   # Checkout + mapa + puntos de recojo + email (S3A-3 / S4-06 / S4-08)
  orders/     # Confirmación guest (S3A-4)
  about/      # /nosotros — copy + imagen staff (S4-07)
  business-settings/ # Contacto e instrucciones públicas
  home/       # Landing y layout compartido
```

Cada módulo tiene su propio `README.md` con el alcance de la etapa.

## Infra compartida

- `src/shared/providers/query-provider.tsx` — TanStack Query
- `src/shared/query/query-keys.ts` — convención de keys
- `src/shared/errors/server-error.ts` — shim de `@de-tin-marin/logging`
  (`guardAction`, `logServer*`; `UNEXPECTED` **sin** mensaje interno al cliente)

## Notificación de orden creada

Tras un `createGuestOrder` exitoso, checkout **await** un correo SMTP
best-effort: cliente + correo operativo de `core.public_business_settings`
(+ extras server-side opcionales). Puede alargar la latencia del checkout;
no cambia el estado de la orden ni garantiza entrega. El paquete compartido
es `@de-tin-marin/notifications`; ver
[`docs/orders.md`](../../docs/orders.md) y su README.

## Feature flags

Importar desde `@/config/store` (re-exporta `@de-tin-marin/config/store-features`):

```typescript
import { storeFeatures } from "@/config/store";
```

| Flag                              | Default | Etapa          |
| --------------------------------- | ------- | -------------- |
| `enableUnitsPerPerson`            | `false` | S3A-2 wizard   |
| `pickupEnabled`                   | `false` | S3A-3 checkout |
| `strictStockValidationOnCheckout` | `false` | S3A-3 checkout |

## Scripts

```bash
pnpm dev:ecommerce   # desarrollo en :3000
pnpm build           # build monorepo
pnpm check           # lint + typecheck + tests
```

## i18n

Mensajes en `messages/es.json` (next-intl).

# Ecommerce — De Tin Marín

App Next.js de la tienda pública (`apps/ecommerce`).

## Estructura de módulos

```
src/modules/
  catalog/    # Listados públicos (S3A-1)
  cart/       # Carrito cliente (S3A-3)
  checkout/   # Checkout + mapa (S3A-3)
  orders/     # Confirmación guest (S3A-4)
  home/       # Landing y layout compartido
```

Cada módulo tiene su propio `README.md` con el alcance de la etapa.

## Infra compartida

- `src/shared/providers/query-provider.tsx` — TanStack Query
- `src/shared/query/query-keys.ts` — convención de keys
- `src/shared/errors/server-error.ts` — `guardAction` para Server Actions

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

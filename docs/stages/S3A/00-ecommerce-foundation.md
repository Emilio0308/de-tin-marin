# S3A-0 · Fundación ecommerce (módulos, flags, orden compartida)

|                |                                                          |
| -------------- | -------------------------------------------------------- |
| **Etapa**      | S3A-0 — Fundación ([roadmap.md](../../roadmap.md) § S3A) |
| **Owner**      | Equipo De Tin Marín                                      |
| **App(s)**     | `apps/ecommerce`, `packages/shared`, `packages/config`   |
| **Schemas**    | — (sin migración obligatoria)                            |
| **Depende de** | S2A ✅                                                   |
| **Estado**     | draft                                                    |

## Contexto (leer esto, no todo docs/)

- S2A ✅ — stock deduct al `paid`; `checkOrderStock` en shared.
- Ecommerce hoy: landing mock en `home-page.tsx` + `home.data.ts` (DECISIONS #23 i18n ya configurado).
- Admin ya implementa catálogo, bundles, `createOrderService` — **extraer** lógica reutilizable, no duplicar reglas de precio/stock.
- DECISIONS #3 — Server Actions in-app; #8 — checkout crea `pending_payment` sin pasarela.
- Feature flags v1 (env o config tipada) para activar comportamiento sin refactor.

## Objetivo

El app `ecommerce` tiene infraestructura de módulos, TanStack Query, i18n, flags de tienda y núcleo compartido de creación de orden listo para S3A-1…S3A-4.

## Scope IN

- **Módulos** bajo `apps/ecommerce/src/modules/`:
  - `catalog/` — listados públicos (S3A-1)
  - `cart/` — carrito cliente (S3A-3)
  - `checkout/` — formulario + mapa (S3A-3)
  - `orders/` — confirmación + consulta guest (S3A-4)
- `QueryClientProvider` + convención query keys en ecommerce layout
- `apps/ecommerce/src/shared/errors/server-error.ts` — `guardAction` (mismo patrón admin)
- **`@de-tin-marin/config/store-features`** (o `apps/ecommerce/src/config/store-features.ts` exportado vía config):

```typescript
export const storeFeatures = {
  enableUnitsPerPerson: false, // S3A-2 wizard
  pickupEnabled: false, // S3A-3 checkout
  strictStockValidationOnCheckout: false, // S3A-3: false = warning; true = rechazar
} as const;
```

- **Extraer** de admin a `@de-tin-marin/shared` (o subpath dedicado):
  - Resolución de productos para orden (`finalUnitPrice`, `items_per_package`)
  - `buildShoppingCart` + `computeOrderTotals` wiring (input → payload congelado)
  - Validación Zod compartida (`createOrderInputSchema` ya en validations)
- Refactor **home**: mantener hero/marketing; **eliminar** catálogo/bundles mock; CTAs → `/productos`, `/sorpresas`
- `apps/ecommerce/messages/es.json` — namespace base (`nav`, `common`, placeholders)
- README módulo ecommerce en `apps/ecommerce/README.md` (estructura + flags)
- Playwright: carpeta `apps/ecommerce/e2e/` con smoke existente actualizado

## Scope OUT (traps)

- **NO páginas de catálogo completas** → S3A-1
- **NO wizard sorpresa** → S3A-2
- **NO carrito/checkout** → S3A-3
- **NO RLS guest orders** → S3A-3 migración
- **NO login / `crm.customers`** → S4
- **NO pasarela** → DECISIONS #8
- **NO `index.ts` barrels**

## Tablas y RLS

Sin cambios en v0. Lectura pública de catálogo ya existe (S1A/S1B RLS `*_select_public`).

## Boundaries y DTOs

| Boundary         | Tipo      | Notas                                         |
| ---------------- | --------- | --------------------------------------------- |
| `getHealth`      | existente | smoke deploy                                  |
| `buildOrderCart` | shared    | función pura exportada para admin + ecommerce |

## Rules que aplican

- DECISIONS #3, #11, #18, #23, #26
- [`rules/88-ui-design-i18n.md`](../../rules/88-ui-design-i18n.md)
- [`rules/85-react-components.md`](../../rules/85-react-components.md)

## Orden de implementación

1. `store-features` + documentar en brief S3A-2/3
2. Extraer helpers orden a `packages/shared` (+ tests Vitest migrados/adaptados)
3. TanStack Query provider + layout ecommerce
4. Esqueleto módulos vacíos + README
5. Refactor `home-page.tsx` (sin mock catalog)
6. i18n namespaces mínimos
7. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] Admin sigue creando órdenes usando helpers extraídos (sin regresión)
- [ ] Vitest — tests de `order-cart` / nuevo helper de build orden verdes
- [ ] Home carga sin `HOME_PRODUCTS` / `HOME_BUNDLES` en producción
- [ ] Flags leíbles desde checkout/wizard (aunque UI aún no exista)
- [ ] Playwright — `apps/ecommerce/e2e/smoke.spec.ts` verde
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — flags y extracción acordados.

## Depends on

- [S2A/01-stock-deduct-on-payment.md](../S2A/01-stock-deduct-on-payment.md)
- [S2B/01-orders.md](../S2B/01-orders.md)

## Bloquea

- S3A-1, S3A-2, S3A-3, S3A-4

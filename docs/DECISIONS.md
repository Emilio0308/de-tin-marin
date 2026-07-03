# DECISIONS — Ledger de decisiones De Tin Marín

> **Precedencia:** donde una decisión aquí contradice otro doc, **este ledger gana**. Actualizar docs afectados al resolver cada ítem.
>
> **Firmado:** 2026-07-02 — Paso 1 completado.

| #   | Tema                      | Estado | Resolución                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Monorepo                  | ✅     | pnpm + Turborepo; apps `ecommerce` + `admin`                                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | Auth boundary             | ✅     | Supabase Auth; RLS como frontera real                                                                                                                                                                                                                                                                                                                                                                                         |
| 3   | API layer                 | ✅     | Server Actions (in-app); `/api/v1` reservado para futuro                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | Pricing vs Orders         | ✅     | Precios calculados en backend al listar/crear orden; Orders congela snapshot — nunca recalcula post-checkout                                                                                                                                                                                                                                                                                                                  |
| 5   | Stock de bundles          | ✅     | **Sin stock.** Bundles/sorpresas son plantillas por demanda; solo productos tienen stock                                                                                                                                                                                                                                                                                                                                      |
| 6   | Precio de bundles         | ✅     | **Dinámico, NO persistido.** `total = service_fee + quantity × Σ(precio_producto × units_per_person)`, calculado en cada consulta desde componentes vivos. Sin columna `prices` en `bundles`; si un producto cambia de precio, el bundle se recalcula solo                                                                                                                                                                    |
| 7   | Moneda                    | ✅     | **Solo PEN (soles peruanos).** `currency_code = 'PEN'` en todo el sistema                                                                                                                                                                                                                                                                                                                                                     |
| 8   | Pasarela de pago          | ✅     | **No en v1.** Pagos internos; operador confirma manualmente. Tabla `commerce.payments` sí existe                                                                                                                                                                                                                                                                                                                              |
| 9   | Cancelación / reembolso   | ✅     | **Manual por operador** en v1 (cambio de estado + reversión de stock manual si aplica)                                                                                                                                                                                                                                                                                                                                        |
| 10  | Campañas por producto     | ✅     | **Relación 1:1** producto↔campaña. Al asignar nueva, se reemplaza la anterior. Sin campaña → `prices.normal`                                                                                                                                                                                                                                                                                                                  |
| 11  | Puertos dev               | ✅     | ecommerce **3000**, admin **3001**                                                                                                                                                                                                                                                                                                                                                                                            |
| 12  | Asistente IA principal    | ✅     | Cursor (`AGENTS.md`); `CLAUDE.md` para compatibilidad                                                                                                                                                                                                                                                                                                                                                                         |
| 13  | Estructura de precios     | ✅     | JSONB `prices` en producto (opción A). v1: `normal` con `netPrice`, `igv`, `subtotal`. Futuro: `suggested`, `fantasy`                                                                                                                                                                                                                                                                                                         |
| 14  | IGV                       | ✅     | `netPrice` = **precio final al cliente (IGV incluido).** Desglose: `subtotal` + `igv` = `netPrice`                                                                                                                                                                                                                                                                                                                            |
| 15  | Stock v1                  | ✅     | **`catalog.products.stock_quantity`** es la fuente de verdad en v1. Schema `inventory` y ledger de movimientos → **v2**                                                                                                                                                                                                                                                                                                       |
| 16  | Cupones / VIP             | ✅     | **Fuera de v1.** Sin tablas ni lógica de cupones ni tier VIP                                                                                                                                                                                                                                                                                                                                                                  |
| 17  | Bundles en órdenes        | ✅     | Plantilla editable al crear orden; snapshot en `order_items` + `order_bundle_items`                                                                                                                                                                                                                                                                                                                                           |
| 18  | Precio en listado         | ✅     | Backend incluye campaña activa en query de productos y devuelve **precio final** — el front no recalcula                                                                                                                                                                                                                                                                                                                      |
| 19  | Nombre del proyecto       | ✅     | **`de-tin-marin`** (carpeta repo, scope npm `@de-tin-marin/*`, marca **De Tin Marín**). Reemplaza nombre provisional `candy`                                                                                                                                                                                                                                                                                                  |
| 20  | Errores en Server Actions | ✅     | Cuerpo de toda action envuelto en `guardAction(scope, run)`. Nunca tragar errores: `logServerError` en helpers server-only. Inesperados → `{ ok:false, error:"UNEXPECTED", message }`. Servicio: `apps/admin/src/shared/errors/server-error.ts`                                                                                                                                                                               |
| 21  | Grants de schemas propios | ✅     | Exponer schema en la API **no basta**: cada migración que crea tablas en un schema propio debe incluir `GRANT USAGE` + privilegios para `anon`/`authenticated`. RLS gobierna filas. Ver `00003_api_grants.sql`                                                                                                                                                                                                                |
| 22  | Modelo de bundles         | ✅     | Bundle = plantilla con `quantity` (nº de personas/porciones a las que apunta el pack) + `service_fee` (referencia/armado). `bundle_items` guarda `units_per_person` por producto (**v1 fija en 1**). Sin stock (#5), sin `prices` propio; total dinámico (#6)                                                                                                                                                                 |
| 23  | i18n                      | ✅     | **`next-intl` sin routing por URL** en ambas apps. `defaultLocale = 'es'`; v1 solo español (`en` declarado en `@de-tin-marin/config/i18n` para habilitar sin refactor). Catálogos en `apps/<app>/messages/es.json`; config en `apps/<app>/src/i18n/request.ts`; tipos aumentados en `src/global.d.ts`. Presentacionales puros: el texto se resuelve en container/layout y baja por props o `useTranslations` en client leaves |

## Docs sincronizados (2026-07-02)

- `database.md`
- `business-rules.md`
- `pricing.md`
- `campaigns.md`
- `inventory.md`
- `orders.md`
- `roadmap.md`

## Docs sincronizados (2026-07-02 — rename)

- Todos los `.md` del repo: `candy` → `de-tin-marin`, `@candy/*` → `@de-tin-marin/*`, marca **De Tin Marín**

## Docs sincronizados (2026-07-03 — S1A errores + grants)

- `rules/40-validation-and-boundaries.md` — sección de manejo de errores y logging
- `supabase/README.md` — nota de grants + migración `00003_api_grants.sql`

## Docs sincronizados (2026-07-03 — S1B modelo de bundles)

- `database.md` — `catalog.bundles` gana `image_url` y `quantity`, pierde `prices` (precio dinámico); `bundle_items.quantity` → `units_per_person`
- `docs/stages/S1B/01-bundles.md` — brief con modelo de precio dinámico
- DECISIONS #6 reescrita; #22 nueva (modelo de bundles)

## Docs sincronizados (2026-07-03 — i18n)

- DECISIONS #23 nueva (i18n con `next-intl`, default `es`)
- `@de-tin-marin/config/i18n` — `locales`, `defaultLocale`, `Locale`, `isLocale`
- `apps/ecommerce` y `apps/admin`: `src/i18n/request.ts`, `messages/es.json`, `next.config.ts` con `createNextIntlPlugin`, layout con `NextIntlClientProvider`, `src/global.d.ts` (tipado de mensajes)

## Cómo añadir una decisión

1. Agregar fila con estado `⏳ Abierto` o `✅` resuelta.
2. Actualizar docs referenciados.
3. Mencionar en el PR qué docs se sincronizaron.

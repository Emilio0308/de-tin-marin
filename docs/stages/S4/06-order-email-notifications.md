# S4-06 · Notificaciones email al crear orden

|                |                                                          |
| -------------- | -------------------------------------------------------- |
| **Etapa**      | S4 — Notifications ([roadmap.md](../../roadmap.md) § S4) |
| **Owner**      | Equipo De Tin Marín                                      |
| **App(s)**     | `apps/ecommerce`, `apps/admin`, `packages/notifications` |
| **Schemas**    | `core` (lectura `public_business_settings`), `commerce`  |
| **Depende de** | S3A-3 ✅, S3A-4 ✅, S4-05 ✅, S2B ✅                     |
| **Estado**     | done                                                     |

## Contexto (leer esto, no todo docs/)

- Checkout guest crea orden vía `createGuestOrderService` → RPC `commerce.insert_guest_order`.
- Admin crea orden vía `createOrderService` → `insertOrderRepo`.
- Contacto guest/admin incluye `email` en `orders.contact` (jsonb).
- Email administrativo operativo = `core.public_business_settings.email` (DECISIONS #38).
- Briefs previos marcaron **NO notificaciones email** → este slice las introduce (best-effort).
- Next.js 15.3+ ofrece `after()` para trabajo post-respuesta sin bloquear el cliente.

## Objetivo

Al crear una orden, el sistema envía correos SMTP (Nodemailer + Gmail App Password) sin condicionar el éxito de la creación: ecommerce notifica cliente + admin; admin solo notifica admin.

## Scope IN

- Paquete `@de-tin-marin/notifications` (`server-only`): SMTP, `notifyOrderCreated`, templates HTML + text, resolución de destinatarios
- Env server (ambas apps): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ORDER_NOTIFY_EXTRA_EMAILS` (opcional), URLs base opcionales para links
- Ecommerce: tras insert exitoso → `after()` → cliente + admin(+extras)
- Admin create: tras insert exitoso → `after()` → solo admin(+extras)
- Fallo SMTP → log server (sin PII) ; orden sigue `{ ok: true }`
- Vitest: recipients, templates, matriz source

## Scope OUT (traps)

- **NO outbox / cola / reintentos / webhooks** → _scope creep_
- **NO correo al cliente desde create admin** → _matriz acordada_
- **NO hardcodear email de prueba** — solo `ORDER_NOTIFY_EXTRA_EMAILS` → _fuga a prod_
- **NO tablas/migraciones nuevas** → _sin RLS extra_
- **NO `index.ts` barrels**
- **NO fallar create order si falta SMTP** — skip + warn → _checkout roto_

## Tablas y RLS

| Tabla (schema)                  | ¿Nueva? | Ops    | Política (prosa)    | Test |
| ------------------------------- | ------- | ------ | ------------------- | ---- |
| `core.public_business_settings` | no      | SELECT | Existente (público) | —    |
| `commerce.orders`               | no      | —      | Sin cambio          | —    |

## Boundaries y DTOs

| Boundary             | Tipo        | Input                                            | Output                                  |
| -------------------- | ----------- | ------------------------------------------------ | --------------------------------------- |
| `notifyOrderCreated` | Package API | `SmtpConfig \| null` + `OrderCreatedNotifyInput` | `{ ok, sent }` / `{ ok: false, error }` |

### `OrderCreatedNotifyInput` (allowlist)

- `source`: `'ecommerce' \| 'admin'`
- `orderId`, `orderNumber`, `total`, `currencyCode`
- `contact`: `{ name, lastName, email, phone }`
- `adminEmail` (desde settings)
- `extraAdminEmails?`
- `customerLookupUrl?`, `adminOrderUrl?`

## Rules que aplican

- Invariantes CLAUDE.md: 3, 5, 7, 8, 15
- `docs/rules/00-architecture.md`, `40-validation-and-boundaries.md` (env Zod, logging sin PII)

## Orden de implementación

1. Brief + roadmap
2. Package notifications + templates + tests
3. Env ambas apps + `.env.example` + turbo env
4. Hooks `after()` en services create
5. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [x] Vitest — `packages/notifications/src/**/*.test.ts`: matriz ecommerce/admin, dedupe extras, HTML/text con orderNumber
- [x] Create order OK aunque `notifyOrderCreated` falle o SMTP sea `null`
- [x] `pnpm check` + `pnpm build` verdes
- [x] Extra emails vacío/ausente en prod → solo `public_business_settings.email`

## Preguntas abiertas

- Ninguna (SMTP Gmail App Password; extras vía env; templates HTML; usar `after()`).

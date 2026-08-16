# `@de-tin-marin/logging`

Logging **server-only** compartido (admin + ecommerce). Sink v1: **stdout/stderr** como JSON de una línea. Sin DB, archivos ni sinks externos (DECISIONS #37).

## Exports

| Subpath                                   | Contenido                                            |
| ----------------------------------------- | ---------------------------------------------------- |
| `@de-tin-marin/logging/server-error`      | `createServerErrorHelpers`, `getErrorMessage`, tipos |
| `@de-tin-marin/logging/guard-action`      | `guardAction`, `withOperation` (core)                |
| `@de-tin-marin/logging/logger`            | `createLogger`                                       |
| `@de-tin-marin/logging/redact`            | `safeMeta`, `isDeniedMetaKey`                        |
| `@de-tin-marin/logging/get-error-message` | `getErrorMessage`                                    |

Las apps **no** importan el core directo en acciones: usan el shim
`apps/<app>/src/shared/errors/server-error.ts`.

## Shim por app

```typescript
// apps/admin → includeUnexpectedMessage: true
// apps/ecommerce → includeUnexpectedMessage: false
import { createServerErrorHelpers } from "@de-tin-marin/logging/server-error";

const helpers = createServerErrorHelpers({
  app: "admin", // | "ecommerce"
  includeUnexpectedMessage: true,
});

export const guardAction = helpers.guardAction;
export const withOperation = helpers.withOperation;
export const logServerError = helpers.logServerError;
export const logServerInfo = helpers.logServerInfo;
export const logServerWarn = helpers.logServerWarn;
```

## Evento JSON (una línea)

```json
{
  "ts": "2026-08-15T12:00:00.000Z",
  "level": "info",
  "app": "admin",
  "scope": "createOrderAction",
  "event": "started",
  "requestId": "a1b2c3d4",
  "durationMs": 42,
  "ok": true,
  "errorCode": "VALIDATION",
  "message": "…",
  "meta": { "lineCount": 3 }
}
```

`guardAction` / `withOperation` emiten `started` → `completed` | `failed`.
`failed` + `logger.error` solo ante `throw`. Un `{ ok: false, error: "…" }` de
negocio deja `completed` con `ok: false` y `errorCode`.

## Metadata segura

`safeMeta` redacta claves denylist (`contact`, `email`, `phone`, `password`,
`token`, `uploadUrl`, `shoppingCart`, `payload`, `issues`, …), trunca arrays y
profundidad. Loguear solo resúmenes: IDs, conteos, códigos.

## Tests

Vitest bajo `packages/logging/src/**/*.test.ts` (proyecto `packages` en
`vitest.config.ts`). Stub de `server-only` en tests.

## Docs canónicos

- [`docs/rules/40-validation-and-boundaries.md`](../../docs/rules/40-validation-and-boundaries.md)
- DECISIONS #20 · #37

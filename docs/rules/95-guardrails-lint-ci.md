# 95 — Guardrails, lint y CI

> **Alcance:** Qué se enforce mecánicamente vs convención + review.

## CI gate (objetivo S0)

```bash
pnpm check   # typecheck + lint + format:check + test
pnpm build   # obligatorio antes de merge — detecta client/server leaks
```

`pnpm check` **no** sustituye a `pnpm build`. El build además revela fugas
`server-only` → client. Tampoco garantiza assets en disco: un
`readFileSync` sobre un `.html`/JSON suelto en un package puede pasar
typecheck/tests locales y fallar en Vercel con `ENOENT` al cargar el módulo
(ver incidente plantillas email → checkout roto). Preferir assets embebidos
como módulos TS; no confiar en `outputFileTracingIncludes` como fix primario.
Detalle: [`coding-guidelines.md`](../coding-guidelines.md) § Assets en
serverless / Vercel.

## ESLint (flat config)

- `eslint-config-next` + TypeScript typed rules
- `--max-warnings=0`
- `import/no-restricted-paths` — UI no importa repositories
- `no-restricted-imports` — ban barrels

## Pre-commit

Husky + lint-staged + Vitest:

- Prettier en archivos staged
- ESLint en TS/TSX
- `pnpm test` (Vitest) — el commit falla si hay tests en rojo

## Vitest (runtime)

Scripts raíz (`package.json`):

```bash
pnpm test        # NODE_OPTIONS=--no-webstorage vitest run
pnpm test:watch  # NODE_OPTIONS=--no-webstorage vitest
```

- **`--no-webstorage`:** Node 25+ expone un stub experimental de Web Storage que puede sombrear el `localStorage` de jsdom; se desactiva en los scripts de test.
- **`vitest.config.ts`:** projects admin/ecommerce usan `environment: "jsdom"` con `environmentOptions.jsdom.url = "http://localhost"`.
- **`vitest.setup.ts`:** fallback in-memory de `window.localStorage` si falta o no es usable (tests de carrito / header).

## TypeScript

`strict: true` en `tsconfig.base.json`

## Tests en CI

| Suite      | Cuándo                             |
| ---------- | ---------------------------------- |
| Vitest     | Cada PR + pre-commit (`pnpm test`) |
| Playwright | PR + nightly en flujos críticos    |
| pgTAP      | Migraciones que tocan RLS          |

## Prohibido en CI

- `ignoreBuildErrors: true`
- Merge con RLS advisors en critical/major sin waiver documentado

## Matriz mecánica vs convención

| Regla                       | Tipo                |
| --------------------------- | ------------------- |
| strict TS                   | Mecánico            |
| server-only import          | Mecánico (build)    |
| no-restricted-paths         | Mecánico (lint)     |
| Assets runtime en bundle    | Convención + review |
| Ownership check en service  | Convención + review |
| DTO allowlist completo      | Convención + review |
| Reglas de negocio correctas | Tests + review      |

## Scripts raíz

```json
{
  "dev": "turbo run dev",
  "dev:ecommerce": "pnpm --filter @de-tin-marin/ecommerce dev",
  "dev:admin": "pnpm --filter @de-tin-marin/admin dev",
  "check": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm test",
  "test": "NODE_OPTIONS=--no-webstorage vitest run",
  "build": "turbo run build"
}
```

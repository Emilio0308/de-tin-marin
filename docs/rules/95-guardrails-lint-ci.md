# 95 — Guardrails, lint y CI

> **Alcance:** Qué se enforce mecánicamente vs convención + review.

## CI gate (objetivo S0)

```bash
pnpm check   # typecheck + lint + format:check + test
pnpm build   # obligatorio antes de merge — detecta client/server leaks
```

## ESLint (flat config)

- `eslint-config-next` + TypeScript typed rules
- `--max-warnings=0`
- `import/no-restricted-paths` — UI no importa repositories
- `no-restricted-imports` — ban barrels

## Pre-commit

Husky + lint-staged:

- Prettier en archivos staged
- ESLint en TS/TSX

## TypeScript

`strict: true` en `tsconfig.base.json`

## Tests en CI

| Suite      | Cuándo                          |
| ---------- | ------------------------------- |
| Vitest     | Cada PR                         |
| Playwright | PR + nightly en flujos críticos |
| pgTAP      | Migraciones que tocan RLS       |

## Prohibido en CI

- `ignoreBuildErrors: true`
- Merge con RLS advisors en critical/major sin waiver documentado

## Matriz mecánica vs convención

| Regla                       | Tipo                |
| --------------------------- | ------------------- |
| strict TS                   | Mecánico            |
| server-only import          | Mecánico (build)    |
| no-restricted-paths         | Mecánico (lint)     |
| Ownership check en service  | Convención + review |
| DTO allowlist completo      | Convención + review |
| Reglas de negocio correctas | Tests + review      |

## Scripts raíz (planificados)

```json
{
  "dev": "turbo dev",
  "dev:ecommerce": "turbo dev --filter=ecommerce",
  "dev:admin": "turbo dev --filter=admin",
  "check": "turbo typecheck lint test && prettier --check .",
  "build": "turbo build"
}
```

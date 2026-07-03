# S0 · Monorepo foundation + Supabase spine

|                |                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Etapa**      | S0 — Fundación ([roadmap.md](../../roadmap.md) § S0)                                                           |
| **Owner**      | Equipo De Tin Marín                                                                                            |
| **App(s)**     | `apps/ecommerce` · `apps/admin`                                                                                |
| **Schemas**    | `core` (tablas spine) · `catalog` · `pricing` · `commerce` · `crm` (solo CREATE SCHEMA, sin tablas de dominio) |
| **Depende de** | Ninguno — primera etapa de código                                                                              |
| **Estado**     | approved                                                                                                       |

## Contexto (leer esto, no todo docs/)

- Documentación y **DECISIONS paso 1** ✅ ([DECISIONS.md](../../DECISIONS.md), 2026-07-02). Monorepo **pnpm + Turborepo**; apps `ecommerce` (puerto **3000**) y `admin` (**3001**).
- Stack: Next.js App Router · TypeScript strict · Tailwind · shadcn/ui · Supabase · Zod · Vitest · Playwright ([adr/0001-stack-and-foundation.md](../../adr/0001-stack-and-foundation.md)).
- S0 entrega la **carcasa ejecutable**: packages compartidos, shells de apps, CI local (`pnpm check` + `pnpm build`), migración spine de Postgres. **Sin lógica de negocio** (productos, órdenes, campañas → S1+).
- Schema `inventory` **no se crea** en v1 ([database.md](../../database.md) — stock en `catalog.products` llega en S1A).
- Módulos de dominio viven bajo `apps/<app>/src/modules/<dominio>/` cuando existan ([architecture.md](../../architecture.md)). S0 solo prepara `src/shared/` por app (clients, config re-export).
- Componentes: container/presentational + `types` + `helpers` + test render ([rules/85-react-components.md](../../rules/85-react-components.md)). **Sin barrels** ([rules/00-architecture.md](../../rules/00-architecture.md)).

## Objetivo

Desde la raíz del repo, `pnpm install` → `pnpm dev` levanta ecommerce (:3000) y admin (:3001); `pnpm check` y `pnpm build` pasan en verde; Supabase local/staging tiene schemas expuestos y tablas `core.*` con RLS habilitado.

## Scope IN

### Monorepo y tooling

- `pnpm-workspace.yaml`, `turbo.json`, `package.json` raíz con scripts: `dev`, `dev:ecommerce`, `dev:admin`, `check`, `build`, `lint`, `format`, `test`, `typecheck`.
- `tsconfig.base.json` — `strict: true` (+ evaluar `noUncheckedIndexedAccess` en ADR).
- ESLint flat config + Prettier + `prettier-plugin-tailwindcss`.
- Husky + lint-staged (pre-commit: format + lint en staged).
- `.env.example` en raíz (sin secretos reales); validación con `@t3-oss/env-nextjs` en `@de-tin-marin/config`.

### Packages (scaffolds mínimos)

| Package                | Nombre npm                  | Entrega S0                                                                                                              |
| ---------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `packages/config`      | `@de-tin-marin/config`      | `env.ts` server/client; export presets TS/ESLint si aplica                                                              |
| `packages/db`          | `@de-tin-marin/db`          | Factories Supabase: `createServerClient`, `createBrowserClient`, `createAdminClient`; `updateSession()` para middleware |
| `packages/shared`      | `@de-tin-marin/shared`      | `cn()` + 1 test Vitest                                                                                                  |
| `packages/types`       | `@de-tin-marin/types`       | Placeholder + script `gen:types` documentado                                                                            |
| `packages/validations` | `@de-tin-marin/validations` | Placeholder (export vacío o schema `HealthCheck`)                                                                       |
| `packages/ui`          | `@de-tin-marin/ui`          | Tailwind + 1 primitivo shadcn (`Button`)                                                                                |
| `packages/ai`          | `@de-tin-marin/ai`          | README placeholder                                                                                                      |

### Apps

- `apps/ecommerce` — Next.js App Router, `next dev -p 3000`, página home mínima, `middleware.ts` con `updateSession()`, `src/config/env.ts` que re-exporta/extends `@de-tin-marin/config`.
- `apps/admin` — igual en puerto **3001**, layout shell (sidebar placeholder), página home admin.
- Ambas: Tailwind v4 o v3 según create-next-app estable; path alias `@/` → `src/`.
- Estructura preparada: `src/shared/clients/`, `src/app/`, sin `src/modules/*` de dominio aún.

### Supabase

- `supabase/config.toml`, `supabase/migrations/00001_spine_schemas_and_core.sql`:
  - `CREATE SCHEMA` para `core`, `catalog`, `pricing`, `commerce`, `crm`.
  - Exponer schemas en API (documentar en README supabase).
  - Tablas **solo en `core`** (ver § Tablas).
  - RLS **ENABLED** en cada tabla creada.
- `supabase/seed.sql` — opcional: 1 usuario staff de prueba (solo local).
- Script raíz `gen:db-types` → `packages/types/src/database.generated.ts`.

### CI / calidad

- Vitest en root o por package; al menos `packages/shared/src/cn.test.ts`.
- Playwright: `apps/admin/e2e/smoke.spec.ts` y `apps/ecommerce/e2e/smoke.spec.ts` — home carga.
- pgTAP harness: `supabase/tests/core__profiles.sql` (mínimo 2 assertions RLS).

## Scope OUT (traps)

- **NO crear tablas de catálogo** (`catalog.products`, `bundles`, …) → S1A/S1B ([database.md](../../database.md)).
- **NO crear `pricing.campaigns` ni tablas commerce/crm** → S1C / S2B / S2C.
- **NO schema `inventory`** → v2.
- **NO CRUD de productos, órdenes, campañas ni UI de negocio** → etapas S1+.
- **NO pasarela de pagos ni webhooks** → S2C manual ([DECISIONS.md](../../DECISIONS.md) #8).
- **NO cupones ni VIP** → fuera v1 (#16).
- **NO `index.ts` barrels** en packages ni apps → _client bundle creep / imports opacos_.
- **NO importar repositories desde components** (aún no existen, pero no crear layout que lo invite) → _boundary violation_.
- **NO `getSession()`** en middleware ni actions — solo `getUser()`/`getClaims()` → _auth bypass_.

## Tablas y RLS

S0 crea **solo** tablas `core`. Schemas `catalog`, `pricing`, `commerce`, `crm` existen vacíos para migraciones futuras.

| Tabla (schema)    | ¿Nueva? | Ops S0               | Política (prosa)                                                                          | pgTAP                                |
| ----------------- | ------- | -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| `core.profiles`   | sí      | SELECT, UPDATE (own) | Usuario lee/actualiza su fila `id = auth.uid()`; staff vía `user_roles` en S1+            | `supabase/tests/core__profiles.sql`  |
| `core.user_roles` | sí      | SELECT               | Usuario lee su propio rol; INSERT/UPDATE solo service-role path (sin policy client write) | (mismo archivo)                      |
| `core.settings`   | sí      | SELECT               | Solo `admin`/`super_admin` vía join `user_roles`; sin write client en S0                  | `supabase/tests/core__settings.sql`  |
| `core.audit_log`  | sí      | INSERT               | Solo server path (service role o SECURITY DEFINER); sin SELECT anon                       | `supabase/tests/core__audit_log.sql` |

**`core.profiles`:** `id uuid PK → auth.users`, `display_name text`, `created_at`, `updated_at`.

**`core.user_roles`:** `user_id uuid`, `role text check (role in ('admin','super_admin'))`, unique `user_id`.

## Boundaries y DTOs

S0 no expone dominio de negocio. Solo health/smoke:

| Boundary        | Tipo                          | Input (Zod) | Output DTO (allowlist)                                  |
| --------------- | ----------------------------- | ----------- | ------------------------------------------------------- |
| `getHealth`     | Server Action o RSC data      | —           | `{ status: 'ok', app: 'ecommerce' \| 'admin' }`         |
| `getOwnProfile` | Server Action (admin, authed) | —           | `{ displayName: string }` — nunca fila cruda `profiles` |

## Rules que aplican

- Invariantes **1, 3, 4, 5, 6, 7, 8, 13, 15** ([CLAUDE.md](../../../CLAUDE.md)).
- [`rules/00-architecture.md`](../../rules/00-architecture.md) — capas, DAL placeholder, no barrels.
- [`rules/10-auth-and-authorization.md`](../../rules/10-auth-and-authorization.md) — middleware, `getUser`.
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md) — RLS ON + policies en misma migración.
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md) — env Zod.
- [`rules/85-react-components.md`](../../rules/85-react-components.md) — si hay componente UI en home, seguir patrón.
- [`rules/95-guardrails-lint-ci.md`](../../rules/95-guardrails-lint-ci.md) — `pnpm check`, ESLint zones.

## Orden de implementación (tracer bullet primero)

1. **Tracer:** `pnpm-workspace` + turbo + `apps/ecommerce` con Next default + `pnpm dev:ecommerce` → página "De Tin Marín ecommerce" sin estilos finales.
2. Duplicar shell `apps/admin` puerto 3001.
3. `packages/config` (env) + `packages/db` (clients) + wire middleware en ambas apps.
4. `packages/shared` + `packages/ui` (Button) — home usa `@de-tin-marin/ui`.
5. Migración `00001_spine_schemas_and_core.sql` + `supabase start` local + pgTAP mínimo.
6. ESLint (no-barrels, restricted paths scaffold) + Husky + scripts `check`/`build`.
7. Playwright smoke ambas apps; Vitest `cn.test.ts`.
8. `.env.example` + README raíz con comandos de desarrollo.

## Criterios de aceptación

- [ ] `pnpm install` sin errores en raíz.
- [ ] `pnpm dev:ecommerce` → http://localhost:3000 muestra home.
- [ ] `pnpm dev:admin` → http://localhost:3001 muestra home admin.
- [ ] `pnpm check` verde (typecheck + lint + format:check + test).
- [ ] `pnpm build` verde (ambas apps) — detecta fugas `server-only`.
- [ ] Vitest — `packages/shared/src/cn.test.ts`: al menos 1 assertion.
- [ ] pgTAP — `supabase/tests/core__profiles.sql`: usuario A no lee perfil de usuario B; anon no escribe en `profiles`.
- [ ] Playwright — `apps/ecommerce/e2e/smoke.spec.ts`: título/home visible.
- [ ] Playwright — `apps/admin/e2e/smoke.spec.ts`: título/home visible.
- [ ] No existe ningún `index.ts` barrel en `apps/` ni `packages/` (grep CI o revisión).
- [ ] `supabase/migrations/00001_*.sql` crea los 5 schemas y las 4 tablas `core.*` con RLS enabled.
- [ ] Documentar en README raíz: comandos, puertos, cómo levantar Supabase local.

## Preguntas abiertas

- **Next.js minor exacto:** usar última estable LTS al momento del scaffold (documentar en ADR addendum si difiere de ADR 0001).
- **Tailwind v3 vs v4:** seguir lo que instale `create-next-app@latest`; documentar en README si hace falta.
- **Supabase remoto staging:** ref del proyecto y quién provisiona — fuera del código S0; local debe bastar para CI del dev.

## Depends on

- [STAGE-BRIEF-TEMPLATE.md](../STAGE-BRIEF-TEMPLATE.md)
- [database.md](../../database.md) — nombres de schemas y tablas `core`
- [DECISIONS.md](../../DECISIONS.md) #1, #11
- [roadmap.md](../../roadmap.md) § S0

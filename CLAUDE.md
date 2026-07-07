# CLAUDE.md

> **Nota para el equipo:** el flujo principal de desarrollo asistido por IA es **Cursor**. Este archivo se mantiene con el nombre `CLAUDE.md` por compatibilidad con Claude Code y otros asistentes que otros devs puedan usar. El contenido es el mismo que [`AGENTS.md`](AGENTS.md).

# De Tin Marín — Reglas del proyecto

De Tin Marín es un **ecommerce de dulces y sorpresas** con backoffice administrativo y backend compartido. No es una app con IA como feature: es una app **diseñada para ser desarrollada y mantenida con ayuda de IA**. La arquitectura prioriza modularidad, contexto reducido y documentación explícita.

**Stack:** Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · shadcn/ui · Supabase (Postgres + Auth + RLS) · TanStack Query · Zod · Turborepo · pnpm · Vercel.

**Apps:** `apps/ecommerce` (tienda pública) · `apps/admin` (backoffice).

**Dominios:** Products · Bundles · Pricing · Campaigns · Orders · Inventory · Customers · Payments · Shipping · Notifications · Reports · Users · Settings.

---

## Comandos (cuando el monorepo exista)

| Comando              | Descripción                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`           | Arranca todas las apps vía Turborepo                                         |
| `pnpm dev:ecommerce` | Solo la tienda (puerto **3000**)                                             |
| `pnpm dev:admin`     | Solo el admin (puerto **3001**)                                              |
| `pnpm check`         | typecheck + lint + format:check + test                                       |
| `pnpm build`         | Build de producción — **obligatorio antes de dar por terminada una feature** |
| `pnpm test`          | Vitest (lógica pura en packages y módulos)                                   |
| `pnpm test:e2e`      | Playwright (flujos críticos)                                                 |

> Los puertos de desarrollo son **fijos**. Si cambias uno, actualiza `packages/config` y la allowlist de Redirect URLs en Supabase.

---

## Convenciones de trabajo (leer en cada sesión)

- **Contexto mínimo:** carga solo el dominio relevante — `CLAUDE.md` + el brief de etapa (si existe) + `docs/` del dominio + `docs/rules/*` aplicables. No leas todo el monorepo.
- **Documentación primero:** si falta una regla de negocio o un contrato DTO, documéntala antes de codear.
- **Commits:** solo cuando el usuario lo pida. No hacer push a producción sin autorización.
- **El gate no es el build:** `pnpm check` no sustituye a `pnpm build`. El build detecta fugas client/server que el typecheck no ve.
- **Imports en client:** usa `import type { … }` desde módulos server; un import de valor arrastra `import "server-only"` al bundle del cliente.
- **Secrets:** nunca pegues valores reales de `.env` en el chat. Lee env solo vía `@de-tin-marin/config/env`.
- **Nombres de tablas:** cópialos de [`docs/database.md`](docs/database.md) § Catálogo — nunca los recuerdes de memoria.

---

## Estado del repo

**Fase actual: documentación y diseño (pre-S0).** El monorepo, Supabase y las apps aún no están implementados. Los paths en ejemplos de código son **ilustrativos** hasta que exista el scaffold.

| Artefacto              | Estado           |
| ---------------------- | ---------------- |
| Guía de arquitectura   | ✅               |
| Docs en `docs/`        | ✅               |
| DECISIONS paso 1       | ✅ (2026-07-02)  |
| Monorepo Turborepo     | ❌ Pendiente S0  |
| Supabase + migraciones | ❌ Pendiente S0  |
| Apps ecommerce / admin | ❌ Pendiente S1+ |

Roadmap detallado: [`docs/roadmap.md`](docs/roadmap.md). Decisiones firmadas: [`docs/DECISIONS.md`](docs/DECISIONS.md) (el ledger gana sobre cualquier otro doc).

---

## Invariantes duros (no negociables)

Cada línea indica el **bug class** que previene.

1. **Cada Server Action re-verifica identidad** (`getUser()` / `getClaims()`, **nunca `getSession()`**) antes de tocar datos. → _bypass de auth por cookie falsificada_
2. **Autorizar ownership, no solo autenticación** — cargar el recurso y verificar que el caller puede actuar. En paths `service_role`, el check en app es la **única** defensa. → _IDOR / escalación de privilegios_
3. **Parsear todo input no confiable con Zod** (args de actions, FormData, `params`/`searchParams`, body de routes, env, respuestas Supabase/fetch); nunca `as`-cast en boundaries. → _inyección / type-confusion / mass-assignment_
4. **RLS habilitado en toda tabla expuesta**; autorizar con claims verificados, **nunca `user_metadata`**. → _exposición total de datos_
5. **Service-role key solo server-side** — nunca `NEXT_PUBLIC_`, nunca en módulos client. → _fuga catastrófica de credenciales_
6. **Session refresh en `middleware.ts`** vía helper canónico `updateSession()`: sin código entre `createServerClient` y el primer `await supabase.auth.getUser()`. → _logouts aleatorios / fuga de sesión_
7. **Módulos con secrets marcan `import "server-only"`**; `process.env` solo vía `@de-tin-marin/config/env`. → _secret en bundle del cliente_
8. **DTOs con allowlist explícita** — nunca filas crudas de Supabase al cliente. → _sobre-exposición de PII/secrets_
9. **Pricing calcula en backend; Orders NO recalcula** — listado productos con `finalPrice`; snapshot al confirmar orden. → _precios inconsistentes_
10. **Stock v1 en `products` (sealed + loose, unidades base)** — bundles sin stock; deduct atómico al `paid` (S2A, post-S1D). → _overselling_
11. **Bundles son plantillas** — composición personalizable; snapshot en `orders.shopping_cart`. → _órdenes inconsistentes con plantilla_
12. **Campaña 1:1 por producto** — precio final en query de catálogo; front no recalcula. → _discrepancia front/back_
13. **Mutaciones solo en Server Actions**; `revalidatePath`/`revalidateTag` **después** del write. → _UI stale / CSRF_
14. **`redirect()` / `notFound()` fuera de try/catch**. → _redirect de auth tragado_
15. **TypeScript `strict: true`**; prohibido `any` (usar `unknown` + narrow). → _null-deref / bugs silenciosos_

---

## Separación de responsabilidades crítica

| Dominio            | Responsabilidad                                                      | NO hace              |
| ------------------ | -------------------------------------------------------------------- | -------------------- |
| **Pricing**        | `finalPrice` en listado + total línea sorpresa                       | Gestionar órdenes    |
| **Orders**         | Ciclo de vida, snapshot, personalización bundle                      | Recalcular precios   |
| **Inventory (v1)** | `stock_sealed_packages` + `stock_loose_base_units`, deduct al `paid` | Calcular precios     |
| **Bundles**        | Plantillas sin stock, `service_fee` editable                         | Tener stock propio   |
| **Campaigns**      | Definir % y asignar 1:1 a producto                                   | Calcular en frontend |

Pipeline de precios: ver [`docs/pricing.md`](docs/pricing.md).

Máquina de estados de órdenes: ver [`docs/orders.md`](docs/orders.md).

---

## Docs de reglas (una fuente canónica cada una)

| Doc                                                                                        | Alcance                                                     |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| [`docs/rules/00-architecture.md`](docs/rules/00-architecture.md)                           | Capas, DAL, boundaries de import, no-barrels                |
| [`docs/rules/10-auth-and-authorization.md`](docs/rules/10-auth-and-authorization.md)       | Auth, ownership, roles admin vs customer                    |
| [`docs/rules/30-rls-and-postgres.md`](docs/rules/30-rls-and-postgres.md)                   | RLS, policies, SECURITY DEFINER                             |
| [`docs/rules/40-validation-and-boundaries.md`](docs/rules/40-validation-and-boundaries.md) | Zod, parse-don't-validate, env                              |
| [`docs/rules/95-guardrails-lint-ci.md`](docs/rules/95-guardrails-lint-ci.md)               | ESLint, CI, pre-commit                                      |
| [`docs/rules/88-ui-design-i18n.md`](docs/rules/88-ui-design-i18n.md)                       | Responsive, i18n, paleta, no mocks en UI                    |
| [`docs/rules/85-react-components.md`](docs/rules/85-react-components.md)                   | Container/presentational, orden de archivo, tests de render |

## Docs de dominio y arquitectura

| Doc                                                      | Contenido                                     |
| -------------------------------------------------------- | --------------------------------------------- |
| [`docs/vision.md`](docs/vision.md)                       | Visión y objetivos                            |
| [`docs/architecture.md`](docs/architecture.md)           | Monorepo, dominios, capas                     |
| [`docs/database.md`](docs/database.md)                   | Modelo de datos canónico (catálogo de tablas) |
| [`docs/pricing.md`](docs/pricing.md)                     | Pipeline de precios                           |
| [`docs/campaigns.md`](docs/campaigns.md)                 | Promociones                                   |
| [`docs/orders.md`](docs/orders.md)                       | Órdenes y estados                             |
| [`docs/inventory.md`](docs/inventory.md)                 | Stock y movimientos                           |
| [`docs/business-rules.md`](docs/business-rules.md)       | Reglas de negocio numeradas                   |
| [`docs/coding-guidelines.md`](docs/coding-guidelines.md) | Guía rápida de código                         |
| [`docs/roadmap.md`](docs/roadmap.md)                     | Etapas de implementación                      |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)                 | Ledger de decisiones                          |

Cada dominio en código incluirá: `README.md` · `RULES.md` · `API.md` · `SCHEMA.md`.

---

## Cómo construimos (workflow molecular)

- **Co-location por dominio:** todo bajo `src/modules/<dominio>/` (actions, services, repositories, schemas, types, components).
- **Una dirección de dependencias:** UI → Server Action → Service → Repository → Supabase.
- **Archivos pequeños:** 150–300 líneas cuando sea posible.
- **Duplicar antes de acoplar:** promover a `packages/` solo cuando hay necesidad cross-feature probada.
- **Stage briefs:** antes de implementar una feature, escribir (o leer) el brief en `docs/stages/` — plantilla en [`docs/stages/STAGE-BRIEF-TEMPLATE.md`](docs/stages/STAGE-BRIEF-TEMPLATE.md).

### Componentes UI

- **Container / presentational** — container con datos y hooks; presentational solo props y JSX.
- **Colaterales:** `*.types.ts` (interfaces), `*.helpers.ts` (funciones puras), `*.test.tsx` (render test del presentational).
- **Nunca `index.ts` ni barrels** — deep import a cada archivo.
- **Orden en el archivo:** Imports → hooks externos (Redux/Zustand/Context/custom) → hooks de estado → lógica → funciones → `useEffect` → componente(s).

Detalle: [`docs/rules/85-react-components.md`](docs/rules/85-react-components.md).

---

## Trampas comunes (triage rápido)

| Síntoma                                | Causa probable                                                         |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `permission denied for table`          | Cliente Supabase incorrecto o RLS sin policy                           |
| Precio distinto en checkout vs carrito | Orders recalculando en lugar de usar snapshot de Pricing               |
| Stock negativo en producción           | Regla 14 no atómica o bundle sin descontar componentes                 |
| Hydration mismatch                     | Valor no determinístico en render (fecha, random, localStorage)        |
| Secret en bundle del cliente           | Import de valor desde módulo `server-only` en `'use client'`           |
| Usuarios deslogueados al azar          | Código entre `createServerClient` y primera llamada auth en middleware |

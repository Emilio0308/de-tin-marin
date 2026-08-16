# Guía de código — De Tin Marín

Resumen rápido. Detalle en [`rules/`](rules/).

## TypeScript

- `strict: true`
- Prohibido `any` — usar `unknown` + narrow
- Tipos de dominio: `z.infer<typeof Schema>` desde Zod
- Branded IDs donde aplique: `type ProductId = string & { readonly brand: unique symbol }`

## Estructura de archivos

- 150–300 líneas por archivo cuando sea posible
- Un export principal por archivo de servicio
- **Nunca `index.ts` ni barrels** — siempre deep imports a la ruta concreta

## Componentes React

Patrón **container / presentational** obligatorio para UI con lógica. Detalle: [`rules/85-react-components.md`](rules/85-react-components.md).

```text
components/<nombre>/
  <nombre>.container.tsx   # datos, hooks, handlers
  <nombre>.tsx             # UI pura (props in, callbacks out)
  <nombre>.types.ts        # interfaces y types
  <nombre>.helpers.ts      # funciones puras
  <nombre>.test.tsx        # test de render del presentational
```

**Orden interno de cada archivo:**

1. Imports
2. Hooks externos (Redux, Zustand, Context, custom hooks, TanStack Query)
3. Hooks de estado (`useState`, `useRef`, …)
4. Lógica (variables derivadas)
5. Funciones (handlers)
6. `useEffect`
7. Componente(s) / return JSX

**Tests:** cada presentational lleva test de render (`*.test.tsx`) — happy path + estados clave (loading, empty).

**Props e i18n (evitar DI en UI):**

- No saturar componentes con props: solo datos de dominio + handlers.
- **Nunca** pasar bags de `labels` ni formatters i18n como props — cada componente usa `useTranslations`.
- Reutilizar types exportados; no tipar dos veces la misma firma en distintos `*.types.ts`.
- Detalle: [`rules/85-react-components.md`](rules/85-react-components.md) · [`rules/88-ui-design-i18n.md`](rules/88-ui-design-i18n.md).

## Inputs numéricos controlados

**Prohibido** ligar `value={number}` a un `onChange` que haga `Number(raw) || fallback` (o `Math.max(..., Number(raw) || min)`) en cada tecla. Eso impide borrar el `0` y produce valores como `04`.

**Obligatorio:**

- Mientras se edita, el draft es **string** (vacío permitido).
- **No** coerción `Number(raw) || fallback` en cada tecla (impide borrar el `0`).
- Clamp / fallback definitivo en **blur** (y validación Zod al submit). Mientras se escribe, se puede emitir un `number` intermedio solo si el draft parsea; vacío no debe forzar `0` hasta blur (salvo `allowEmpty` → `null`).
- Preferir `type="text"` + `inputMode="numeric"` | `"decimal"` (evitar spinners nativos de `type="number"`).
- Enteros: solo dígitos. Decimales: dígitos + un separador `.` (p. ej. `"12."` válido mientras se escribe).
- El contrato de dominio / Server Action sigue siendo `number` (o `null` si el campo es opcional). El draft de UI **no** sustituye Zod.

```tsx
// ❌ Anti-patrón
<input
  type="number"
  value={price}
  onChange={(e) => setPrice(Number(e.target.value) || 0)}
/>

// ✅ Draft string + commit en blur (usar GranularNumberInput en admin)
<GranularNumberInput
  mode="decimal"
  value={price}
  min={0}
  onValueChange={setPrice}
/>
```

En admin: helpers en `apps/admin/src/shared/forms/number-draft.helpers.ts` y componente `granular-number-input.tsx` (también [`rules/85-react-components.md`](rules/85-react-components.md) § Inputs numéricos).

## Capas

```text
components/  → UI (Server por defecto)
actions/     → 'use server'
services/    → lógica + authz + DTO
repositories/→ queries Supabase
```

**Prohibido:** importar `repositories/` desde `components/`.

## Server vs Client

- `'use client'` solo en hojas interactivas (forms, carrito, toggles)
- Pasar Server Components como `children`
- `import type` desde módulos server en archivos client

## Validación

- Zod en cada boundary — ver [`rules/40-validation-and-boundaries.md`](rules/40-validation-and-boundaries.md)
- `safeParse` en actions; devolver `Result` tipado

## Variables de entorno

Al **agregar una variable de entorno nueva**, completar **todos** estos pasos (si falta uno, Vercel/Turbo falla aunque la var exista en el dashboard):

1. Schema + `runtimeEnv` en `apps/<app>/src/config/env.ts` (o el paquete `config` canónico).
2. Entrada documentada en [`.env.example`](../.env.example) (sin valores secretos reales).
3. **Obligatorio:** listarla en [`turbo.json`](../turbo.json) → `tasks.build.env`.
   - Turbo **no** inyecta al build las vars de Vercel que no estén ahí — el deploy falla con Zod/`createEnv` o con el warning de Turborepo sobre platform env vars.
4. Si es `NEXT_PUBLIC_*`, confirmar que no filtra secrets (nunca AWS keys ni service role).

Detalle de boundaries: [`rules/40-validation-and-boundaries.md`](rules/40-validation-and-boundaries.md) · media: [`infra.md`](infra.md).

## Errores y logging (obligatorio)

**Nunca tragar un error en silencio.** Un `catch {}` vacío o un `Result` fallido sin log deja la UI con mensaje genérico y Vercel/terminal sin causa.

**Sink v1:** solo consola del servidor (JSON una línea vía `@de-tin-marin/logging`). Sin guardar registros. Detalle: DECISIONS #37 · [`rules/40`](rules/40-validation-and-boundaries.md) · [`packages/logging/README.md`](../packages/logging/README.md).

| Dónde                   | Qué usar                                                            | Dónde se ve                                |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Server Action / service | `guardAction` + `logServerError` / `Info` / `Warn` (shim → package) | **Vercel → Runtime Logs** / terminal local |
| Container client admin  | `logClientError` (`shared/errors/client-error.ts`)                  | **Consola del browser** (DevTools)         |

Reglas:

1. Toda Server Action envuelve el cuerpo en `guardAction("scope", …)` → eventos `started` / `completed` / `failed`.
2. Mutaciones críticas también loguean en el **service** (resumen seguro).
3. Metadata = resumen (IDs, códigos, conteos); nunca PII, secrets ni payloads crudos (`safeMeta`).
4. Todo `catch` en containers admin debe `logClientError(scope, error)`.
5. Fallos de PUT a S3 (CORS/red) ocurren en el **browser** — no aparecen en Vercel.
6. Tras un deploy, si Vercel no muestra logs al fallar: o el fallo es client-side, o el action no llegó a ejecutarse.
7. Admin: `UNEXPECTED` puede incluir `message`. Ecommerce: **sin** mensaje interno.

Detalle: [`rules/40-validation-and-boundaries.md`](rules/40-validation-and-boundaries.md) § Manejo de errores.

## Supabase

- Cliente server en actions/services
- RLS como frontera de autorización
- Service role solo en server paths con check de ownership

## Estilos

- Tailwind CSS + shadcn/ui
- Tokens en CSS variables / `@theme` — ver `apps/*/src/app/globals.css`
- Componentes en `@de-tin-marin/ui`
- **UI / i18n / responsive / paleta / sin mocks:** [`rules/88-ui-design-i18n.md`](rules/88-ui-design-i18n.md)

## Tests

| Tipo          | Dónde                               | Qué                                         |
| ------------- | ----------------------------------- | ------------------------------------------- |
| Vitest render | `**/*.test.tsx` junto al componente | Render del presentational                   |
| Vitest        | `packages/`, `services/`            | Pricing pipeline, transiciones, validadores |
| Playwright    | `apps/*/e2e/`                       | Checkout, admin CRUD                        |
| pgTAP         | `supabase/tests/`                   | RLS, deduct inventory                       |

`pnpm test` usa `NODE_OPTIONS=--no-webstorage` (compat Node 25+) y `vitest.setup.ts` con fallback de `localStorage` — ver [`rules/95-guardrails-lint-ci.md`](rules/95-guardrails-lint-ci.md).

## Nombres

| Elemento       | Convención                                      |
| -------------- | ----------------------------------------------- |
| Archivos       | `kebab-case.ts`                                 |
| Componentes    | `PascalCase.tsx`                                |
| Functions      | `camelCase`                                     |
| Tablas DB      | `snake_case`                                    |
| Server Actions | `verbNoun` — `createProduct`, `transitionOrder` |

## Formato

- Prettier en save / CI
- ESLint `--max-warnings=0`

## Commits

- Solo cuando el usuario lo solicite
- Mensajes en español o inglés según equipo — ser consistentes

## Checklist antes de PR

- [ ] `pnpm check` verde
- [ ] `pnpm build` verde
- [ ] Variable de entorno nueva → schema `env.ts` + `.env.example` + `turbo.json` `tasks.build.env`
- [ ] Errores: `guardAction` / `logServer*` (server JSON vía `@de-tin-marin/logging`) o `logClientError` (client admin) — sin `catch` vacío; meta sin PII
- [ ] Componente nuevo: container + presentational + types + helpers (si aplica) + test de render
- [ ] Inputs numéricos: draft string, sin coerción `Number(raw) || fallback` por keystroke
- [ ] Sin `index.ts` / barrels en imports
- [ ] Docs del dominio actualizados si cambió contrato
- [ ] Regla de negocio nueva → `business-rules.md`
- [ ] Tabla nueva → `database.md`

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
- [ ] Componente nuevo: container + presentational + types + helpers (si aplica) + test de render
- [ ] Sin `index.ts` / barrels en imports
- [ ] Docs del dominio actualizados si cambió contrato
- [ ] Regla de negocio nueva → `business-rules.md`
- [ ] Tabla nueva → `database.md`

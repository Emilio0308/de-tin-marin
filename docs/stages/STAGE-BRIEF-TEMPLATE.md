# Stage brief template — `docs/stages/<stage>/<nn>-<feature>.md`

> **Propósito:** Contrato que la IA implementa **sin leer todo el blueprint**. Escribir antes de cada feature. Aprobar con el equipo.

**Barra de calidad:** Un brief está listo cuando una sesión IA con solo `CLAUDE.md` + este brief + rules listadas puede implementar la feature y los **tests nombrados** bloquean invariantes rotas.

**Reglas:**

- Todas las secciones son obligatorias. "Ninguno" es válido; sección ausente no.
- **Nombres de tablas copiados de [`database.md`](../database.md)** — nunca de memoria.
- **Scope OUT (traps)** es la sección más importante para trabajo paralelo.
- Criterios de aceptación nombran **archivos** de test.
- DTOs como allowlists explícitas.
- Máximo ~2 páginas.

---

## Plantilla

```markdown
# <stage-id> · <Título de la feature>

|                |                                              |
| -------------- | -------------------------------------------- |
| **Etapa**      | <stage-id> — ver [roadmap.md](../roadmap.md) |
| **Owner**      | <dev>                                        |
| **App(s)**     | ecommerce / admin                            |
| **Schemas**    | catalog / commerce / …                       |
| **Depende de** | <otros briefs>                               |
| **Estado**     | draft → approved → in-progress → done        |

## Contexto (leer esto, no todo docs/)

<3–8 bullets con hechos load-bearing + links a secciones canónicas>

## Objetivo

<Una frase testeable.>

## Scope IN

- <lista exacta de lo que shippea>

## Scope OUT (traps)

- **NO <trap>** — pertenece a <feature/brief> → _<bug class>_

## Tablas y RLS

| Tabla (schema) | ¿Nueva? | Ops | Política (prosa) | Test                 |
| -------------- | ------- | --- | ---------------- | -------------------- |
|                |         |     |                  | `supabase/tests/...` |

## Boundaries y DTOs

| Boundary     | Tipo          | Input (Zod) | Output DTO (allowlist)      |
| ------------ | ------------- | ----------- | --------------------------- |
| `actionName` | Server Action |             | `{ field }` — nunca raw row |

## Rules que aplican

- Invariantes de CLAUDE.md: <números>
- `docs/rules/<file>`

## Orden de implementación

1. Tracer bullet end-to-end (sin polish)
2. …

## Criterios de aceptación

- [ ] Vitest — `<archivo>`: <assertions>
- [ ] Playwright — `apps/<app>/e2e/<spec>.ts`: <escenarios>
- [ ] `pnpm check` + `pnpm build` verdes
- [ ] Revisado por owner

## Preguntas abiertas

- <decisiones pendientes para el owner>
```

---

## Ejemplo mínimo — S1A Products CRUD

# s1a · Products CRUD (admin)

|             |         |
| ----------- | ------- |
| **Etapa**   | s1a     |
| **App(s)**  | admin   |
| **Schemas** | catalog |
| **Estado**  | draft   |

## Objetivo

Un admin puede crear, editar, listar y desactivar productos con SKU único y precio base.

## Scope IN

- Server Actions: `createProduct`, `updateProduct`, `listProducts`, `deactivateProduct`
- Pantallas admin: listado + formulario
- Tablas: `catalog.categories`, `catalog.products`, `catalog.product_images`

## Scope OUT (traps)

- **NO calcular precios con campañas** → s1c Pricing
- **NO tocar bundles** → s1b
- **NO stock/inventory** → s2a

## Criterios de aceptación

- [ ] Vitest — reglas SKU y precio >= 0
- [ ] Playwright — crear producto y verlo en listado

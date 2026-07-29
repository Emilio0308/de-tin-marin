# De Tin Marín — Documentación

Documentación canónica del proyecto. La IA y los devs deben leer **solo lo relevante** para la tarea actual.

## Orden de lectura recomendado

| #   | Documento                                                    | Qué responde                                |
| --- | ------------------------------------------------------------ | ------------------------------------------- |
| 1   | [vision.md](vision.md)                                       | Por qué existe el proyecto                  |
| 2   | [architecture.md](architecture.md)                           | Cómo está organizado el monorepo            |
| 3   | [database.md](database.md)                                   | Tablas, relaciones, RLS (catálogo canónico) |
| 4   | [business-rules.md](business-rules.md)                       | Reglas de negocio numeradas                 |
| 5   | Dominio específico                                           | pricing · campaigns · orders · inventory    |
| 6   | [coding-guidelines.md](coding-guidelines.md)                 | Convenciones de código                      |
| 7   | [rules/](rules/)                                             | Reglas técnicas detalladas                  |
| 8   | [rules/88-ui-design-i18n.md](rules/88-ui-design-i18n.md)     | Responsive, i18n, paleta, datos reales      |
| 9   | [rules/85-react-components.md](rules/85-react-components.md) | Container/presentational, tests de render   |

## Decisiones y planificación

- [DECISIONS.md](DECISIONS.md) — ledger de decisiones firmadas (**gana sobre otros docs**)
- [roadmap.md](roadmap.md) — etapas S0→S4
- [stages/S0/01-monorepo-foundation.md](stages/S0/01-monorepo-foundation.md) — brief S0 (monorepo + spine) ✅
- [stages/STAGE-BRIEF-TEMPLATE.md](stages/STAGE-BRIEF-TEMPLATE.md) — plantilla de briefs
- [adr/0001-stack-and-foundation.md](adr/0001-stack-and-foundation.md) — stack base

## Entrada para agentes IA

- **Cursor:** [`AGENTS.md`](../AGENTS.md)
- **Claude Code / otros:** [`CLAUDE.md`](../CLAUDE.md)

## Por dominio (en código)

| Módulo                                   | README (actions / services / rutas)                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Catálogo (categories, products, bundles) | [`apps/admin/src/modules/catalog/README.md`](../apps/admin/src/modules/catalog/README.md) |
| Orders                                   | [`apps/admin/src/modules/orders/README.md`](../apps/admin/src/modules/orders/README.md)   |

Código fuente:

- **Actions:** `apps/admin/src/modules/<dominio>/actions/*.ts`
- **Services:** `apps/admin/src/modules/<dominio>/services/*.ts`
- **Repositories:** `apps/admin/src/modules/<dominio>/repositories/*.ts`

Briefs de etapa (contrato DTO): `docs/stages/S1A`, `S1B`, `S2B`, `S3A`, …

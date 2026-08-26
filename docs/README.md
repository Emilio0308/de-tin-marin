# De Tin Marín — Documentación

Documentación canónica del proyecto. La IA y los devs deben leer **solo lo relevante** para la tarea actual.

> **Al documentar / sync docs:** leer primero [`DOC-WORKFLOW.md`](DOC-WORKFLOW.md) (regla Cursor `doc-workflow`).

## Orden de lectura recomendado

| #   | Documento                                                    | Qué responde                                     |
| --- | ------------------------------------------------------------ | ------------------------------------------------ |
| 0   | [DOC-WORKFLOW.md](DOC-WORKFLOW.md)                           | Cómo actualizar docs (obligatorio al documentar) |
| 1   | [vision.md](vision.md)                                       | Por qué existe el proyecto                       |
| 2   | [architecture.md](architecture.md)                           | Cómo está organizado el monorepo                 |
| 2b  | [infra.md](infra.md)                                         | Media CDN: S3 + CloudFront, reglas y deploy      |
| 3   | [database.md](database.md)                                   | Tablas, relaciones, RLS (catálogo canónico)      |
| 4   | [business-rules.md](business-rules.md)                       | Reglas de negocio numeradas                      |
| 5   | Dominio específico                                           | pricing · campaigns · orders · inventory         |
| 6   | [coding-guidelines.md](coding-guidelines.md)                 | Convenciones de código                           |
| 7   | [rules/](rules/)                                             | Reglas técnicas detalladas                       |
| 8   | [rules/88-ui-design-i18n.md](rules/88-ui-design-i18n.md)     | Responsive, i18n, paleta, datos reales           |
| 9   | [rules/85-react-components.md](rules/85-react-components.md) | Container/presentational, tests de render        |

## Decisiones y planificación

- [DOC-WORKFLOW.md](DOC-WORKFLOW.md) — flujo para documentar features (**leer antes de sync docs**)
- [DECISIONS.md](DECISIONS.md) — ledger de decisiones firmadas (**gana sobre otros docs**)
- [infra.md](infra.md) — media CDN (S3 + CloudFront), entornos staging/prod, guía de deploy
- [roadmap.md](roadmap.md) — etapas S0→S4
- [stages/S0/01-monorepo-foundation.md](stages/S0/01-monorepo-foundation.md) — brief S0 (monorepo + spine) ✅
- [stages/S0/02-infra-media-cdn.md](stages/S0/02-infra-media-cdn.md) — brief S0 media CDN
- [stages/S0/03-admin-pack-image-upload.md](stages/S0/03-admin-pack-image-upload.md) — brief upload imágenes catálogo (presign)
- [stages/S4/01-catalog-status-excel.md](stages/S4/01-catalog-status-excel.md) — brief export Excel estado catálogo ✅
- [stages/S4/02-product-cost-margin.md](stages/S4/02-product-cost-margin.md) — brief costo/margen productos ✅
- [stages/S4/04-pack-dual-quantities.md](stages/S4/04-pack-dual-quantities.md) — brief BOM pack package+unit ✅
- [stages/S4/08-pickup-points.md](stages/S4/08-pickup-points.md) — brief puntos de recojo ✅
- [stages/S4/09-cancel-atomic-restock.md](stages/S4/09-cancel-atomic-restock.md) — brief cancel atómico (refund + restock) ✅
- [stages/S4/10-order-status-in-transit-awaiting-pickup.md](stages/S4/10-order-status-in-transit-awaiting-pickup.md) — brief estados `in_transit` / `awaiting_pickup` ✅
- [stages/S4/11-courier-shipping.md](stages/S4/11-courier-shipping.md) — brief envío courier (agencia nacional) ✅
- [stages/S4/12-storefront-settings.md](stages/S4/12-storefront-settings.md) — brief reglas generales de tienda ✅
- [stages/S3A/01-remediation-catalog-pagination-sql.md](stages/S3A/01-remediation-catalog-pagination-sql.md) — remediación paginación catálogo público ✅
- [stages/S3B/01-admin-list-pagination.md](stages/S3B/01-admin-list-pagination.md) — paginación listados admin ✅
- [stages/STAGE-BRIEF-TEMPLATE.md](stages/STAGE-BRIEF-TEMPLATE.md) — plantilla de briefs
- [adr/0001-stack-and-foundation.md](adr/0001-stack-and-foundation.md) — stack base

## Entrada para agentes IA

- **Cursor:** [`AGENTS.md`](../AGENTS.md)
- **Claude Code / otros:** [`CLAUDE.md`](../CLAUDE.md)

## Por dominio (en código)

| Módulo                                   | README (actions / services / rutas)                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| Catálogo (categories, products, bundles) | [`apps/admin/src/modules/catalog/README.md`](../apps/admin/src/modules/catalog/README.md)     |
| Orders                                   | [`apps/admin/src/modules/orders/README.md`](../apps/admin/src/modules/orders/README.md)       |
| Dashboard                                | [`apps/admin/src/modules/dashboard/README.md`](../apps/admin/src/modules/dashboard/README.md) |
| Reports                                  | [`apps/admin/src/modules/reports/README.md`](../apps/admin/src/modules/reports/README.md)     |

Código fuente:

- **Actions:** `apps/admin/src/modules/<dominio>/actions/*.ts`
- **Services:** `apps/admin/src/modules/<dominio>/services/*.ts`
- **Repositories:** `apps/admin/src/modules/<dominio>/repositories/*.ts`

Briefs de etapa (contrato DTO): `docs/stages/S1A`, `S1B`, `S2B`, `S3A`, …

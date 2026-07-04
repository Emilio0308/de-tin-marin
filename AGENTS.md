# AGENTS.md

> **Cursor:** este es el archivo de entrada principal para agentes en Cursor.
> **Claude Code / otros:** el mismo contenido vive en [`CLAUDE.md`](CLAUDE.md) — mantener ambos sincronizados al editar reglas del proyecto.

Ver [`CLAUDE.md`](CLAUDE.md) para el contenido completo: invariantes, comandos, convenciones, docs de reglas y workflow.

**Resumen para agentes:**

1. De Tin Marín = ecommerce de dulces y sorpresas · monorepo · Supabase · dominio-driven.
2. Carga **solo** el dominio relevante (`docs/` + módulo + rules aplicables).
3. **Pricing ≠ Orders ≠ Inventory** — responsabilidades separadas (invariantes 9–11).
4. Reglas de negocio en [`docs/business-rules.md`](docs/business-rules.md).
5. Tablas canónicas en [`docs/database.md`](docs/database.md) — copiar nombres, no recordar.
6. **Campaña 1:1** — `finalPrice` en backend; front no recalcula.
7. **Componentes:** container/presentational + `types` + `helpers` + test render — [`docs/rules/85-react-components.md`](docs/rules/85-react-components.md).
8. **UI / i18n:** responsive, paleta, sin mocks — [`docs/rules/88-ui-design-i18n.md`](docs/rules/88-ui-design-i18n.md).
9. **Repo:** `de-tin-marin` · scope `@de-tin-marin/*`.

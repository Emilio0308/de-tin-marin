# Cómo funciona la documentación de De Tin Marín

Guía operativa para agentes y devs: qué leer, qué actualizar y en qué orden cuando cambia una feature.

> **Obligatorio:** si el usuario pide documentar, actualizar docs, sync de documentación o alinear docs con una feature, **leer este archivo primero** y seguir el checklist. Regla Cursor: `.cursor/rules/doc-workflow.mdc`.

---

## 1. Principios duros

1. **Contexto mínimo.** No leas todo `docs/`. Carga: `AGENTS.md` / `CLAUDE.md` + brief de la etapa + docs de dominio + `docs/rules/*` aplicables.
2. **Documentación primero.** Si falta una regla de negocio o un contrato DTO, documéntalo antes (o a la vez) que el código.
3. **Una fuente canónica por tema.** No inventes nombres de tablas: cópialos de [`database.md`](database.md).
4. **Precedencia:** si hay conflicto, **[`DECISIONS.md`](DECISIONS.md) gana** sobre cualquier otro doc. Luego alinear el resto.
5. **Documentar el comportamiento del código**, no el plan ideal. Si el brief viejo dice X y el código hace Y, actualiza brief/cross-refs o marca el delta.
6. **No pegar secrets** (`.env`, SMTP reales, keys). Describe variables por nombre, no valores.
7. **Español** en docs de producto/negocio. Código/IDs técnicos en inglés (`pickup_point`, `shipping_total`).

---

## 2. Capas de documentación (mapa)

| Capa              | Dónde                                          | Qué es                                          | Cuándo tocar                                       |
| ----------------- | ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Entrada agentes   | `AGENTS.md` + `CLAUDE.md`                      | Invariantes, comandos, trampas                  | Solo si cambia un invariante / trampa transversal  |
| Índice docs       | [`README.md`](README.md)                       | Orden de lectura                                | Si aparece un doc canónico nuevo relevante         |
| **Este workflow** | [`DOC-WORKFLOW.md`](DOC-WORKFLOW.md)           | Cómo actualizar docs                            | Pedido de documentar / sync                        |
| Ledger            | [`DECISIONS.md`](DECISIONS.md)                 | Decisiones firmadas (#N) + “Docs sincronizados” | Toda feature con decisión de producto/arquitectura |
| Roadmap           | [`roadmap.md`](roadmap.md)                     | Etapas S0→S4, checklists                        | Al cerrar / abrir feature                          |
| Brief             | `stages/<Sx>/<nn>-<slug>.md`                   | Contrato de implementación                      | Feature nueva o cambio de alcance                  |
| Dominio           | `orders.md`, `pricing.md`, …                   | Comportamiento del dominio                      | Si cambia el contrato del dominio                  |
| Datos             | [`database.md`](database.md)                   | Tablas, columnas, RLS, RPCs                     | Migración / schema / policy                        |
| Negocio           | [`business-rules.md`](business-rules.md)       | Reglas numeradas (Regla N)                      | Nueva regla o cambio de pasos/fallos               |
| Rules técnicas    | [`rules/`](rules/)                             | Auth, Zod, cache, UI, CI…                       | Cambio de patrón transversal                       |
| Infra             | [`infra.md`](infra.md)                         | CDN, entornos                                   | Media / deploy                                     |
| Coding            | [`coding-guidelines.md`](coding-guidelines.md) | Convenciones (p. ej. assets serverless)         | Trampas de código globales                         |
| README módulo     | `apps/*/src/modules/<dom>/README.md`           | Rutas, actions, límites del módulo              | UI/API del módulo cambió                           |
| README package    | `packages/<pkg>/README.md`                     | Contrato del package                            | API pública del package cambió                     |

Plantilla de brief: [`stages/STAGE-BRIEF-TEMPLATE.md`](stages/STAGE-BRIEF-TEMPLATE.md).

---

## 3. Precedencia (si chocan dos docs)

```text
DECISIONS.md  >  business-rules.md / database.md  >  docs de dominio  >  briefs  >  READMEs de módulo
```

- Briefs históricos pueden quedar parcialmente desactualizados: al tocarlos, **añade cross-ref** a la decisión/regla nueva (no reescribas toda la historia si no hace falta).
- El ledger `#N` debe reflejar el estado **✅** y el contrato final (migración, brief, regla).

---

## 4. Flujo obligatorio al documentar una feature (ya implementada o al cerrar)

### Paso A — Leer el código (fuente de verdad)

1. Migración(es) `supabase/migrations/00xxx_*.sql`
2. Zod en `packages/validations`
3. Shared puro en `packages/shared` (fees, coverage, etc.)
4. Services/actions admin + ecommerce
5. Tests (Vitest / pgTAP) que fijan el contrato

### Paso B — Decidir IDs

| Artefacto              | Cuándo                                     | Ejemplo reciente                           |
| ---------------------- | ------------------------------------------ | ------------------------------------------ |
| **DECISIONS #N**       | Cambio de producto/arquitectura no trivial | #38 contacto, #39 emails, #40 pickup_point |
| **Regla de negocio N** | Comportamiento operativo / invariante      | Regla 27–30                                |
| **Brief `S4-0X`**      | Feature de etapa                           | S4-06 emails, S4-07 about, S4-08 puntos    |
| Solo sync de docs      | Fix docs / aclaración sin decisión nueva   | Entrada “Docs sincronizados”               |

### Paso C — Checklist de archivos (marcar lo que aplique)

- [ ] `docs/DECISIONS.md` — fila #N **y** bloque `## Docs sincronizados (YYYY-MM-DD — <tema>)` **arriba** de los syncs anteriores
- [ ] `docs/roadmap.md` — sección feature ✅ + Depends on + link al brief
- [ ] `docs/stages/.../NN-slug.md` — brief (IN/OUT, RLS, DTOs, aceptación)
- [ ] `docs/database.md` — tablas/columnas/RLS/RPC (nombres exactos)
- [ ] `docs/business-rules.md` — Regla N + índice rápido al final
- [ ] Doc de dominio (`orders.md`, etc.)
- [ ] Briefs **relacionados** (cross-ref; p. ej. S3A-3 si checkout cambia)
- [ ] `docs/architecture.md` / `infra.md` / `coding-guidelines.md` / `rules/*` si el cambio es transversal
- [ ] README(s) del módulo tocado (`apps/admin/...`, `apps/ecommerce/...`)
- [ ] README del package si hay package nuevo/cambiado
- [ ] `AGENTS.md` / `CLAUDE.md` **solo** si hay trampa/invariante nuevo (mantener ambos sync)

### Paso D — Calidad del texto

- Contratos: métodos, XOR, kill switches, quién puede qué (guest vs admin).
- **Scope OUT (traps)** con bug class (`→ _IDOR_`, `→ _overselling_`).
- Distinguir flags distintos (ej. `pickupEnabled` ≠ `pickup_points_enabled`).
- Snapshot vs lectura en vivo (qué se congela en la orden y qué no).
- No documentar valores de env reales.

---

## 5. Anatomía de un sync en DECISIONS.md

Al cerrar documentación de una feature:

1. Asegurar fila en la tabla de decisiones (si hay #N nuevo).
2. Añadir **al inicio** de la sección de syncs:

```markdown
## Docs sincronizados (YYYY-MM-DD — <título corto>)

- DECISIONS #N — <una línea del contrato>
- Migración `000XX_...sql` + efecto (tabla / RPC / RLS)
- Comportamiento clave (guest vs admin, kill switch, snapshot…)
- Docs tocados: Regla N, `database.md`, `orders.md`, brief S4-0X, READMEs …
```

**Importante:** no mezclar temas en un mismo bloque sync (ej. no meter “Nosotros” dentro del sync de “puntos de recojo”).

---

## 6. Anatomía de una Regla de negocio

En [`business-rules.md`](business-rules.md):

```markdown
### Regla N — Título

- **Trigger:** cuándo aplica
- **Pasos:** 1…n (comportamiento real del código)
- **Alcance / Guest / Admin:** si difieren
- **RLS:** si aplica
- **Fallo:** códigos / rechazo / no tumbar X
```

También actualizar el **índice rápido** al final del archivo.

---

## 7. Anatomía de un brief (`docs/stages/...`)

Usar [`STAGE-BRIEF-TEMPLATE.md`](stages/STAGE-BRIEF-TEMPLATE.md). Secciones obligatorias:

- Contexto · Objetivo · Scope IN · **Scope OUT (traps)** · Tablas y RLS · Boundaries/DTOs · Rules · Criterios de aceptación

Al marcar **done**: checkboxes `[x]` alineados con lo shippeado. Si un brief viejo (S1E, S3A) queda incompleto respecto a una feature posterior, **no reescribirlo entero**: añade bullets/cross-ref al brief nuevo (S4-08, etc.).

---

## 8. READMEs de módulo / package

- Cortos, operativos: rutas, actions, flags, qué **no** hacen.
- Link a docs canónicos (Regla, DECISIONS, brief).
- Crear README si el módulo es nuevo o pasó a ser superficie estable (ej. `apps/admin/src/modules/delivery/README.md`).

---

## 9. Ejemplos recientes (patrón a imitar)

| Feature                    | Decisión   | Regla | Brief | Docs clave                                            |
| -------------------------- | ---------- | ----- | ----- | ----------------------------------------------------- |
| Contacto / pagos dinámicos | #38        | 27    | —     | `database.md`, `orders.md`, READMEs business-settings |
| Email orden creada         | #39        | 28    | S4-06 | `orders.md`, package notifications, trampas Vercel    |
| Plantillas email embebidas | sync #39   | —     | S4-06 | `coding-guidelines.md`, `rules/95`, `CLAUDE.md`       |
| Imagen Nosotros            | #35 extend | 29    | S4-07 | `database.md`, `infra.md`, READMEs web-customization  |
| Puntos de recojo           | #40        | 19+30 | S4-08 | `database.md`, `orders.md`, delivery/checkout READMEs |

Contrato #40 (ejemplo de claridad requerida):

- `pickup` = recojo **en tienda** (admin; fee 0)
- `pickup_point` = catálogo `pricing.pickup_points` (coords + fee; snapshot)
- Guest: solo `delivery` \| `pickup_point`
- Flag `storeFeatures.pickupEnabled` **no** controla puntos; sí `delivery_settings.pickup_points_enabled`

---

## 10. Anti-patrones (no hacer)

- Actualizar solo el README del módulo y olvidar `DECISIONS` / Regla / `database.md`
- Inventar nombres de tabla/columna de memoria
- Documentar “cómo debería ser” en vez del código
- Duplicar el mismo párrafo en 5 sitios sin fuente canónica (elige canónico + links)
- Meter un sync de feature A dentro del bloque de feature B
- Ampliar `AGENTS.md`/`CLAUDE.md` por cada feature (solo trampas/invariantes globales)
- Commit de docs sin que el usuario lo pida

---

## 11. Checklist rápido “¿terminé de documentar?”

- [ ] ¿Hay decisión #N o se reutilizó una existente?
- [ ] ¿Hay Regla N (o se actualizó la existente)?
- [ ] ¿`database.md` refleja migración + RLS?
- [ ] ¿Roadmap + brief done?
- [ ] ¿Docs de dominio + READMEs del módulo?
- [ ] ¿Briefs vecinos con cross-ref si el flag/contrato cambió?
- [ ] ¿Bloque “Docs sincronizados” en DECISIONS con lista de archivos?
- [ ] ¿El texto distingue guest vs admin, snapshot vs live, kill switches?

---

## 12. Orden de lectura para un agente nuevo en una feature

```text
1. AGENTS.md (resumen) / CLAUDE.md (invariantes)
2. docs/DOC-WORKFLOW.md (esta guía — si la tarea es documentar)
3. docs/DECISIONS.md — fila #N + último sync del tema
4. Brief docs/stages/S*/NN-*.md
5. docs/database.md (tablas tocadas)
6. docs/business-rules.md (Regla N)
7. Doc de dominio (orders/pricing/…)
8. README del módulo + código (services/actions/migración)
9. docs/rules/* solo las listadas en el brief
```

---

## 13. Separación de dominios (no mezclar en docs)

| Dominio           | Hace                                     | No hace                            |
| ----------------- | ---------------------------------------- | ---------------------------------- |
| Pricing           | `finalPrice`, fees delivery/pickup_point | Ciclo de vida de órdenes           |
| Orders            | Snapshot, estados, fulfillment           | Recalcular precios de catálogo     |
| Inventory         | Stock deduct al `paid`                   | Precios                            |
| Packs             | BOM fija, sin stock propio               | Personalización tipo bundle        |
| Notifications     | Email SMTP best-effort (await en create) | Garantizar entrega / outbox v1     |
| Settings públicos | Contacto, Yape, hero, about              | Congelar instrucciones en la orden |

Mantener esa separación también en la documentación.

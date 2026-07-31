# S4-03 · Hero dinámico + Personalización web (admin)

|                |                                              |
| -------------- | -------------------------------------------- |
| **Etapa**      | S4 — Completitud / settings                  |
| **Owner**      | Equipo De Tin Marín                          |
| **App(s)**     | `apps/admin`, `apps/ecommerce`               |
| **Schemas**    | `core`                                       |
| **Depende de** | S0-03 media upload ✅, S3A home ecommerce ✅ |
| **Estado**     | done                                         |

## Contexto

- Hero home ecommerce: imagen hardcodeada en `hero-section.tsx`.
- Upload catálogo: presign S3 + CloudFront (DECISIONS #34/#35); folders `packs|products|bundles|containers|hero`.
- Sin tablas CMS; `core.settings` existe pero no se usa en app.
- Dimensiones hero UI: `aspect-square` → validación **aspecto 1:1** (±2 %), min 600 px.

## Objetivo

Staff configura modo (`static` \| `carousel`) e imágenes del hero con orden y vigencia; ecommerce las muestra con fallback a la imagen actual si no hay slides vigentes o falla el fetch.

## Scope IN

- Tablas `core.hero_settings` (singleton) + `core.hero_images`
- Migración `00020_hero_web_customization.sql` + pgTAP
- Folder S3 `hero` en `createCatalogImageUploadUrlAction`
- Admin `/web-customization`: modo, CRUD imágenes, orden, fechas, upload cuadrado 1:1
- Ecommerce: `getPublicHeroConfigAction` + hero static/carousel + fallback hardcodeado
- Admin preview del marco hero (estático/carrusel)

## Scope OUT (traps)

- **NO** editar copy/CTAs del hero (siguen en i18n) → _scope creep_
- **NO** borrado de objetos S3 huérfanos → _igual catálogo_
- **NO** dependencia carousel externa (Embla/Swiper) → _bundle bloat_
- **NO** inferir modo del conteo de slides → _modo es explícito_
- **NO** filtro de vigencia solo en RLS — service filtra `now()` → _clock skew / testabilidad_

## Tablas y RLS

| Tabla (schema)       | ¿Nueva? | Ops                           | Política (prosa)             | Test                                     |
| -------------------- | ------- | ----------------------------- | ---------------------------- | ---------------------------------------- |
| `core.hero_settings` | sí      | SELECT público; UPDATE staff  | Singleton `display_mode`     | `supabase/tests/core__hero_settings.sql` |
| `core.hero_images`   | sí      | SELECT no-deleted; CRUD staff | Soft-delete; vigencia en app | `supabase/tests/core__hero_images.sql`   |

## Boundaries y DTOs

| Boundary                    | Tipo          | Input (Zod)                                           | Output DTO (allowlist)                                        |
| --------------------------- | ------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `updateHeroSettingsAction`  | Server Action | `{ displayMode }`                                     | `{ ok }`                                                      |
| `createHeroImageAction`     | Server Action | `{ imageUrl, altText?, sortOrder, startsAt, endsAt }` | `{ id }`                                                      |
| `updateHeroImageAction`     | Server Action | `{ id, … }`                                           | `{ ok }`                                                      |
| `deleteHeroImageAction`     | Server Action | `id`                                                  | `{ ok }`                                                      |
| `reorderHeroImagesAction`   | Server Action | `{ orderedIds: uuid[] }`                              | `{ ok }`                                                      |
| `getPublicHeroConfigAction` | Server Action | —                                                     | `{ displayMode, slides: [{ imageUrl, altText, sortOrder }] }` |

## Rules que aplican

- Invariantes: 1–5, 7–8, 13–15
- `docs/rules/00-architecture.md`, `10-auth-and-authorization.md`, `30-rls-and-postgres.md`, `40-validation-and-boundaries.md`, `85-react-components.md`, `88-ui-design-i18n.md`

## Orden de implementación

1. Docs (`database.md`, roadmap, DECISIONS #35 folder `hero`)
2. Migración + grants + pgTAP + types
3. Media folder `hero` + validación aspecto cuadrado
4. Admin módulo + UI + preview
5. Ecommerce public config + hero UI
6. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [x] Staff cambia modo y CRUD imágenes con orden/fechas; upload S3 `hero/`
- [x] Archivo no cuadrado / demasiado pequeño se rechaza en UI
- [x] Ecommerce static → 1 slide vigente; carousel → N; vacío/error → imagen hardcodeada
- [x] Vitest — helpers validación + `hero-section.test.tsx`
- [x] pgTAP — `core__hero_settings.sql`, `core__hero_images.sql` (archivos listos; aplicar migración en entorno)
- [x] `pnpm build` verde (`/web-customization` en admin)

## Preguntas abiertas

- Ninguna (cerradas en plan: modo explícito, rango por imagen, aspecto cuadrado, tablas `core`).

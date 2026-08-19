# S4-07 · Imagen personalizable en Nosotros

|                |                                                 |
| -------------- | ----------------------------------------------- |
| **Etapa**      | S4 — Completitud / settings                     |
| **Owner**      | Equipo De Tin Marín                             |
| **App(s)**     | `apps/admin`, `apps/ecommerce`                  |
| **Schemas**    | `core`                                          |
| **Depende de** | S0-03 media ✅, S4-03 hero web customization ✅ |
| **Estado**     | done                                            |

## Contexto

- `/nosotros` usa `ABOUT_STORY_IMAGE_URL` (placeholder catálogo) en un slot landscape `aspect-[1.79]`.
- Admin ya personaliza el hero en `/web-customization` (S4-03); esta feature reutiliza esa pantalla, no una pestaña nueva.
- Upload: presign S3 + CloudFront (DECISIONS #34/#35).

## Objetivo

Staff sube o restaura la foto de “Nuestra Historia”; ecommerce la muestra en SSR con fallback al placeholder si no hay URL o falla el fetch.

## Scope IN

- Tabla singleton `core.about_page_settings` (`image_url` nullable)
- Migración `00027_about_page_settings.sql` + pgTAP
- Folder S3 `about` + validación landscape ~16:9, ancho ≥ 800 px
- Admin: sección **Nosotros** en `/web-customization` (pestaña dedicada; upload diferido, preview, restaurar default)
- Ecommerce SSR: `AboutPageContainer` → `getPublicAboutPageImageService` + `resolveAboutStoryImageUrl`
- Validación compartida: `@de-tin-marin/validations/about-page` (aspecto, ancho mínimo, Zod DTO)

## Scope OUT (traps)

- **NO** editar copy/misión/visión/valores → _scope creep_
- **NO** carrusel, orden ni rangos de fecha (un solo slot) → _copiar hero a ciegas_
- **NO** borrar objetos S3 huérfanos → _igual catálogo/hero_
- **NO** tumbar `/nosotros` si falla settings → _fallback obligatorio_

## Tablas y RLS

| Tabla (schema)             | ¿Nueva? | Ops                          | Política (prosa)                       | Test                                           |
| -------------------------- | ------- | ---------------------------- | -------------------------------------- | ---------------------------------------------- |
| `core.about_page_settings` | sí      | SELECT público; UPDATE staff | Singleton; `image_url` null = fallback | `supabase/tests/core__about_page_settings.sql` |

## Boundaries y DTOs

| Boundary                         | Tipo          | Input (Zod)                    | Output DTO (allowlist)         |
| -------------------------------- | ------------- | ------------------------------ | ------------------------------ |
| `getAboutPageSettingsAction`     | Server Action | —                              | `{ imageUrl: string \| null }` |
| `updateAboutPageSettingsAction`  | Server Action | `{ imageUrl: string \| null }` | `{ ok }`                       |
| `getPublicAboutPageImageService` | Service SSR   | —                              | `{ imageUrl: string \| null }` |

## Rules que aplican

- Invariantes: 1–5, 7–8, 13–15
- `docs/rules/00-architecture.md`, `10-auth-and-authorization.md`, `30-rls-and-postgres.md`, `40-validation-and-boundaries.md`, `85-react-components.md`, `88-ui-design-i18n.md`

## Orden de implementación

1. Migración `00027` + pgTAP + types
2. Folder S3 `about` en presign + helpers `about-image-file.ts`
3. Actions/services/repos about en módulo `web-customization`
4. Pestaña Nosotros en `WebCustomizationPage` + container (presign al guardar)
5. Ecommerce: service + `resolveAboutStoryImageUrl` + container SSR
6. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [x] Staff sube imagen landscape; se persiste URL CDN en `about_page_settings`
- [x] Restaurar default pone `image_url = null`; ecommerce usa `ABOUT_STORY_IMAGE_URL`
- [x] Aspecto no ~16:9 o ancho &lt; 800 se rechaza en UI
- [x] Fetch error no rompe `/nosotros`
- [x] Vitest helpers validación + resolución de URL
- [x] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna (una imagen, singleton `core`, landscape, fallback placeholder).

## Relacionado

- Hero en la misma pantalla admin: [`03-hero-web-customization.md`](03-hero-web-customization.md)
- README admin: [`apps/admin/src/modules/web-customization/README.md`](../../../apps/admin/src/modules/web-customization/README.md)
- README ecommerce: [`apps/ecommerce/src/modules/about/README.md`](../../../apps/ecommerce/src/modules/about/README.md)

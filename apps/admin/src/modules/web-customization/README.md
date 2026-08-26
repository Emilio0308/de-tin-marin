# Web customization — módulo admin

Personalización visual del ecommerce desde una sola pantalla: **hero home**
(S4-03) e **imagen de Nosotros** (S4-07).

Canónico: [`docs/stages/S4/03-hero-web-customization.md`](../../../../docs/stages/S4/03-hero-web-customization.md) ·
[`docs/stages/S4/07-about-page-image.md`](../../../../docs/stages/S4/07-about-page-image.md) ·
[`docs/database.md`](../../../../docs/database.md) § `core.hero_*` y
`core.about_page_settings` · DECISIONS #35.

## Ruta

- `/web-customization` (nav admin).
- UI con pestañas: **Inicio** (hero) · **Nosotros** (foto “Nuestra Historia”).

## Alcance por pestaña

| Pestaña  | Tablas                         | Qué configura staff                                       |
| -------- | ------------------------------ | --------------------------------------------------------- |
| Inicio   | `hero_settings`, `hero_images` | Modo static/carousel, slides, orden, vigencia, upload 1:1 |
| Nosotros | `about_page_settings`          | Una imagen landscape; restaurar placeholder               |

Copy del hero y de `/nosotros` (misión, visión, valores) **no** se edita aquí —
sigue en i18n / `about.data.ts` en ecommerce.

## Server Actions

### Hero (S4-03)

| Action                     | Service        |
| -------------------------- | -------------- |
| `getHeroSettingsAction`    | `hero.service` |
| `updateHeroSettingsAction` | `hero.service` |
| `createHeroImageAction`    | `hero.service` |
| `updateHeroImageAction`    | `hero.service` |
| `deleteHeroImageAction`    | `hero.service` |
| `reorderHeroImagesAction`  | `hero.service` |

### Nosotros (S4-07)

| Action                          | Service              |
| ------------------------------- | -------------------- |
| `getAboutPageSettingsAction`    | `about-page.service` |
| `updateAboutPageSettingsAction` | `about-page.service` |

Todas exigen `requireStaff`; RLS de `UPDATE` también exige `core.is_staff()`.

## Upload de imágenes

Presign compartido: `createCatalogImageUploadUrlAction` (`modules/media/`).

| Pestaña  | Folder S3 | Validación client (helpers)                  |
| -------- | --------- | -------------------------------------------- |
| Inicio   | `hero`    | `hero-image-file.ts` — 1:1, ≥600 px          |
| Nosotros | `about`   | `about-image-file.ts` — ~16:9, ancho ≥800 px |

Constantes compartidas: `@de-tin-marin/validations/about-page` y
`@de-tin-marin/validations/hero`.

Flujo igual que catálogo: preview local (`blob:`) → PUT S3 al **Guardar** →
persistir URL CloudFront en DB. Restaurar Nosotros envía `{ imageUrl: null }`.

## Capas

```text
WebCustomizationPageContainer
  → hero.actions / about-page.actions
    → hero.service / about-page.service
      → hero.repository / about-page.repository
        → core.hero_* / core.about_page_settings
```

TanStack Query: `["hero-settings"]`, `["hero-images"]`, `["about-page-settings"]`.

## Consumidores ecommerce

- Hero: `getPublicHeroConfig` → home (`hero-section`).
- Nosotros: `getPublicAboutPageImageService` →
  `AboutPageContainer` (`/nosotros`).

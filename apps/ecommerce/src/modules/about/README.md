# About — módulo ecommerce

Página pública `/nosotros`: historia, misión, visión, valores y contacto.

Brief imagen personalizable: [`docs/stages/S4/07-about-page-image.md`](../../../../docs/stages/S4/07-about-page-image.md).

## Ruta

- `src/app/nosotros/page.tsx` → `AboutPageContainer` (RSC).

## Datos

| Fuente                          | Qué aporta                                        |
| ------------------------------- | ------------------------------------------------- |
| `about.data.ts`                 | Copy de marca (historia, misión, visión, valores) |
| `core.about_page_settings`      | URL opcional de la foto “Nuestra Historia”        |
| `core.public_business_settings` | WhatsApp + email (Regla 27)                       |
| Constantes en `about.data.ts`   | Facebook / TikTok                                 |

El container hace `Promise.all` de business settings + imagen Nosotros en SSR.

## Imagen “Nuestra Historia”

1. `getPublicAboutPageImageService` lee el singleton y valida
   `publicAboutPageImageSchema`.
2. `resolveAboutStoryImageUrl(imageUrl)` elige URL final:
   - URL `http`/`https` válida → usar CDN staff.
   - `null`, vacío, inválido o fetch con error → `ABOUT_STORY_IMAGE_URL`
     (placeholder catálogo).
3. Se inyecta en `content.storyImageUrl` del presentational; el slot UI usa
   `aspect-[1.79]` (~16:9).

**Invariante:** un fallo de settings **no** tumba `/nosotros` — siempre hay
imagen visible vía fallback.

Contacto sigue la misma regla dura que business settings: si
`getPublicBusinessSettingsService` falla, el container lanza (la página necesita
WhatsApp/email operativos).

## Boundaries

```text
AboutPageContainer
  → getPublicBusinessSettingsService
  → getPublicAboutPageImageService
    → about-page.repository → core.about_page_settings
  → buildStorefrontContactLinks
  → AboutPage (presentational)
```

Validación compartida con admin:
`@de-tin-marin/validations/about-page`.

## Fuera de scope v1

- Editar texto de misión/visión/valores desde admin.
- Carrusel o múltiples fotos en Nosotros (solo un slot).
- Credenciales AWS en ecommerce (solo consume URLs públicas CDN).

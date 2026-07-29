# Infra — Media CDN (S3 + CloudFront)

> **Canónico** para infraestructura AWS de imágenes de catálogo.  
> Código: [`infra/cdk/`](../infra/cdk/). Decisiones: [DECISIONS.md](DECISIONS.md) #34 · #35.  
> Briefs: [S0/02](stages/S0/02-infra-media-cdn.md) · [S0/03](stages/S0/03-admin-pack-image-upload.md) (upload catálogo completo).

## Qué es (y qué no)

| Sí                                                  | No                                     |
| --------------------------------------------------- | -------------------------------------- |
| IaC con **AWS CDK** (TypeScript) en el monorepo     | Otra app Next.js (`apps/`)             |
| Bucket S3 privado + CloudFront (OAC) + IAM uploader | Terraform / state local                |
| Un **stack CloudFormation por entorno**             | Un solo bucket compartido staging/prod |
| La app apunta con **variables de entorno**          | Hardcode de bucket/CDN en código       |

Analogía con Supabase: cada entorno tiene su proyecto/URL; aquí cada entorno tiene su stack media y su set de env.

## Arquitectura

```text
Admin (browser)
  → Server Action (presign, staff-only)
  → PUT prefirmado → S3 (privado)
  → URL pública CloudFront guardada en image_url
Ecommerce / Admin listados
  → leen image_url (CDN HTTPS)
```

```text
infra/cdk/
  bin/app.ts           # declara MediaStaging + MediaProduction
  lib/media-stack.ts   # Bucket + CloudFront OAC + IAM uploader
  README.md            # atajos operativos
```

Estado de la infra: **CloudFormation en AWS** (no hay `terraform.tfstate` en el laptop).

## Reglas (invariantes)

1. **Bucket privado** — Block Public Access; lectura solo vía CloudFront OAC.
2. **Nombres genéricos** — sin marca de producto (`media-staging-<accountId>`, `media-uploader-staging`, …).
3. **Un stack por entorno** — `MediaStaging` ≠ `MediaProduction`; buckets y CDN separados.
4. **Secrets fuera de CDK outputs** — el stack exporta `UploaderUserName`; la Access Key se crea a mano en IAM y vive solo en env server del admin.
5. **Presign solo server-side** — `import "server-only"`; never `NEXT_PUBLIC_` para AWS keys.
6. **Path S3 lo elige el server** — p. ej. `packs/{uuid}.ext`; el client no manda keys arbitrarias.
7. **CORS restringido** — solo orígenes del admin de ese entorno (staging incluye `http://localhost:3001`).
8. **Retention** — buckets con `RemovalPolicy.RETAIN` (borrar stack no borra objetos automáticamente).
9. **Deploy explícito** — no entra en `pnpm dev` ni en turbo `build` de las apps.

## Stacks

| Stack CDK         | `environmentName` | Bucket (patrón)                | IAM user                    |
| ----------------- | ----------------- | ------------------------------ | --------------------------- |
| `MediaStaging`    | `staging`         | `media-staging-<accountId>`    | `media-uploader-staging`    |
| `MediaProduction` | `production`      | `media-production-<accountId>` | `media-uploader-production` |

Región por defecto: **`us-east-1`** (`CDK_DEFAULT_REGION`).

### Outputs (ambos stacks)

| Output                   | Env admin                                                                        |
| ------------------------ | -------------------------------------------------------------------------------- |
| `BucketName`             | `MEDIA_S3_BUCKET`                                                                |
| `CdnBaseUrl`             | `NEXT_PUBLIC_MEDIA_CDN_BASE_URL`                                                 |
| `DistributionDomainName` | (host CDN; opcional)                                                             |
| `UploaderUserName`       | referencia para crear Access Key → `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` |

También: `AWS_REGION=us-east-1`.

## Guía de deploy

### Prerrequisitos

```bash
aws sts get-caller-identity
pnpm install
```

### Bootstrap (una vez por cuenta + región)

```bash
pnpm infra:bootstrap
```

Si staging y prod están en la **misma** cuenta/región, **no** hace falta bootstrap de nuevo.

### Staging (día a día / local)

```bash
pnpm infra:synth                 # template CloudFormation, sin aplicar
pnpm infra:deploy                # alias → MediaStaging
# o explícito:
pnpm infra:deploy:staging
```

1. Crear Access Key del user `media-uploader-staging` en la consola IAM.
2. Pegar outputs + keys en `apps/admin/.env` (ver [`.env.example`](../.env.example)).
3. Smoke test (opcional):

```bash
BUCKET=<BucketName>
CDN=<DistributionDomainName>
echo "ok" | aws s3 cp - "s3://${BUCKET}/smoke/test.txt" --content-type text/plain
curl -sI "https://${CDN}/smoke/test.txt"   # 200
```

### Production (cuando toque)

1. En [`infra/cdk/bin/app.ts`](../infra/cdk/bin/app.ts), poner el origen real del admin prod en `corsAllowedOrigins` de `MediaProduction` (sin eso, el PUT desde el browser fallará por CORS).
2. Deploy **solo** prod (no toca staging):

```bash
pnpm infra:deploy:production
```

3. Crear Access Key de `media-uploader-production` (distinta de staging).
4. Configurar env en el hosting de **Production** (Vercel u otro), no en el `.env` local de staging:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=…          # uploader production
AWS_SECRET_ACCESS_KEY=…
MEDIA_S3_BUCKET=media-production-<accountId>
NEXT_PUBLIC_MEDIA_CDN_BASE_URL=https://xxxx.cloudfront.net
```

Igual que cambiar Supabase URL entre preview/production: **mismo código, distinto env**.

### Comandos útiles

| Comando                                                            | Efecto                       |
| ------------------------------------------------------------------ | ---------------------------- |
| `pnpm infra:bootstrap`                                             | Prep CDK en la cuenta/región |
| `pnpm infra:synth`                                                 | Synth de todos los stacks    |
| `pnpm infra:deploy` / `infra:deploy:staging`                       | Deploy `MediaStaging`        |
| `pnpm infra:deploy:production`                                     | Deploy `MediaProduction`     |
| `pnpm --filter @de-tin-marin/infra-cdk exec cdk diff MediaStaging` | Diff sin aplicar             |

## App admin (consumo)

- Módulo: `apps/admin/src/modules/media/` — `createCatalogImageUploadUrlAction` con `folder`: `packs` | `products` | `bundles` | `containers`.
- Validación: `image/jpeg` · `image/png` · `image/webp` · máx. **10 MiB**.
- **Subida diferida:** el archivo se elige en el form (preview local); el PUT a S3 ocurre al **Guardar** (evita objetos huérfanos). Integrado en las cuatro carpetas: `packs/` · `products/` · `bundles/` · `containers/`.
- Config server: `apps/admin/src/config/media.ts` (`server-only`).
- En Vercel las vars deben existir **y** estar listadas en `turbo.json` → `tasks.build.env` (si no, Turbo no las inyecta al build aunque estén en el dashboard).
- Catálogo sigue guardando **URL texto** en `image_url`; no hay tabla de assets en v1.
- Ecommerce **no** necesita credenciales AWS: solo muestra `imageUrl`.

## Checklist antes de prod

- [ ] CORS de `MediaProduction` con origen HTTPS del admin real
- [ ] `pnpm infra:deploy:production` OK y outputs anotados
- [ ] Access key del uploader **production** (no reutilizar staging)
- [ ] Env Production del admin rellenado
- [ ] Smoke: subir imagen desde admin prod → objeto en bucket prod → 200 vía CDN prod
- [ ] Confirmar que staging sigue apuntando a bucket/CDN staging

## Fuera de scope (hoy)

- Dominio custom (`cdn.…`) + ACM
- Borrado automático de objetos huérfanos / al soft-delete
- OIDC Vercel→AWS (sustituir access keys estáticas) — mejora futura
- Tabla `assets` / metadata de imágenes en Postgres (sigue siendo URL texto en `image_url`)

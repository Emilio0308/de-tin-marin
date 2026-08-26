# Infra CDK — Media (S3 + CloudFront)

Documentación canónica (reglas, entornos, guía completa): **[`docs/infra.md`](../../docs/infra.md)**.

## Comandos rápidos

```bash
pnpm infra:bootstrap              # una vez por cuenta/región
pnpm infra:synth
pnpm infra:deploy                 # = staging
pnpm infra:deploy:staging
pnpm infra:deploy:production      # stack MediaProduction (aislado)
```

## Stacks

| Stack             | Script                    | Bucket patrón                  |
| ----------------- | ------------------------- | ------------------------------ |
| `MediaStaging`    | `infra:deploy:staging`    | `media-staging-<accountId>`    |
| `MediaProduction` | `infra:deploy:production` | `media-production-<accountId>` |

Antes del primer upload desde admin **prod**, configurar `corsAllowedOrigins` de `MediaProduction` en [`bin/app.ts`](bin/app.ts).

## Outputs → env admin

| Output             | Variable                                                         |
| ------------------ | ---------------------------------------------------------------- |
| `BucketName`       | `MEDIA_S3_BUCKET`                                                |
| `CdnBaseUrl`       | `NEXT_PUBLIC_MEDIA_CDN_BASE_URL`                                 |
| `UploaderUserName` | crear Access Key → `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` |

Más: `AWS_REGION=us-east-1`. Detalle en [`docs/infra.md`](../../docs/infra.md).

## Briefs / decisiones

- [S0/02-infra-media-cdn.md](../../docs/stages/S0/02-infra-media-cdn.md)
- [S0/03-admin-pack-image-upload.md](../../docs/stages/S0/03-admin-pack-image-upload.md)
- [DECISIONS.md](../../docs/DECISIONS.md) #34 · #35

# Business settings — consumidor público ecommerce

Proveedor de contacto e instrucciones de pago dinámicas desde el singleton
`core.public_business_settings`.

Canónico: [`docs/database.md`](../../../../../docs/database.md) y Regla 27
en [`docs/business-rules.md`](../../../../../docs/business-rules.md).

## Boundary

`getPublicBusinessSettingsAction` no recibe input y delega en
`getPublicBusinessSettingsService`. El repositorio usa el cliente Supabase
server; el service transforma la fila a la allowlist
`PublicBusinessSettings` y la valida con
`@de-tin-marin/validations/business-settings`.

Resultados:

```ts
{ ok: true, data: PublicBusinessSettings }
{ ok: false, error: "NOT_FOUND" | "UNEXPECTED" }
```

No pasar la fila de Supabase ni ampliar el DTO sin revisar que el campo sea
publicable.

## Uso

- RSC: Nosotros, Términos y Privacidad obtienen los datos en servidor y
  construyen enlaces con `build-contact-links.ts`.
- Cliente: Help FAB y confirmación de pedido usan la action con TanStack Query,
  key `queryKeys.businessSettings.public()` y `staleTime` de 5 min.
- Órdenes: `build-payment-instruction-labels.ts` combina los datos dinámicos
  con los textos i18n. Solo se muestran para `pending_payment`.

`whatsappE164` se formatea para UI y se transforma a `https://wa.me/...`;
`email` usa `mailto:`. El teléfono Yape se formatea solo para visualización.

## Invariantes

- Estos datos se leen en vivo; no se congelan dentro de una orden.
- Mostrar instrucciones no crea `commerce.payments`, no cambia
  `payment_status` y no descuenta stock.
- Si la configuración no está disponible, no inventar valores estáticos ni
  mostrar instrucciones de pago incompletas.

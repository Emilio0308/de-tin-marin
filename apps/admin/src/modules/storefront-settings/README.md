# Storefront settings — módulo admin

Reglas generales de la tienda (promo de envío, pedido mínimo, avisos).

Canónico: [`docs/database.md`](../../../../../docs/database.md) §
`core.storefront_settings` · DECISIONS #44 · Regla 32 ·
[`docs/stages/S4/12-storefront-settings.md`](../../../../../docs/stages/S4/12-storefront-settings.md).

## Ruta

- `/storefront-settings` (nav **Tienda**).
- Actions staff (`requireStaff`): `getStorefrontSettingsAction`,
  `updateStorefrontSettingsAction`.
- Singleton `singleton_key = 'default'` (sin INSERT/DELETE de app).

## Campos

| Grupo       | Campos                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| Promo envío | `freeDelivery`, `freePickupPoint`, ventana `freeFulfillmentStartsAt` / `EndsAt` |
| Pedido mín. | `minOrderSubtotal` (`0` = off; solo guest en checkout)                          |
| Aviso       | `announcementEnabled`, `announcementMessage` (máx. ~500 chars)                  |

Zod: `@de-tin-marin/validations/storefront-settings`. Overlay de fee:
`@de-tin-marin/shared/storefront-settings`.

## Capas

```text
StorefrontSettingsPageContainer
  → get/updateStorefrontSettingsAction
    → storefront-settings.service
      → storefront-settings.repository
        → core.storefront_settings
```

No mezclar con `/delivery` (tarifas base / kill switches) ni
`/business-settings` (contacto/pagos). La promo **no** pone fees de zona o
punto en 0 en DB; solo overlay al resolver fee.

# Storefront settings — ecommerce (lectura pública)

Lee el singleton `core.storefront_settings` para checkout (fee overlay,
pedido mínimo, aviso).

Canónico: [`docs/database.md`](../../../../../docs/database.md) §
`core.storefront_settings` · DECISIONS #44 · Regla 32 ·
[`docs/stages/S4/12-storefront-settings.md`](../../../../../docs/stages/S4/12-storefront-settings.md).
Admin edita en `/storefront-settings`.

## Uso

| Pieza                          | Rol                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `getStorefrontSettingsAction`  | Server Action pública (allowlist DTO)                                           |
| `getStorefrontSettingsService` | Repo → DTO; fallback defaults si falta fila                                     |
| Shared                         | `applyStorefrontShippingFee`, `assertMinOrderSubtotal`, `getActiveAnnouncement` |

Query key: `queryKeys.storefrontSettings.public()`. Consumidores:
`checkout-delivery.service`, `guest-order.service`,
`checkout-page.container` (banner + hint mínimo + copy “envío gratis”).

No mezclar con `public_business_settings` (contacto/pagos) ni con fees base
de `/delivery`.

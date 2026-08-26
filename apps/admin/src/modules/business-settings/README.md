# Business settings — módulo admin

Configuración única de contacto e instrucciones de pago que ecommerce expone
como información pública operativa.

Canónico: [`docs/database.md`](../../../../../docs/database.md) §
`core.public_business_settings` · Regla 27 en
[`business-rules.md`](../../../../../docs/business-rules.md).

**≠** [`storefront-settings`](../storefront-settings/README.md) (promo envío /
pedido mínimo / aviso — Regla 32 / DECISIONS #44).

## Ruta y autorización

- Ruta: `/business-settings` (nav admin).
- Actions: `getBusinessSettingsAction`, `updateBusinessSettingsAction`.
- Ambas ejecutan `requireStaff`; la RLS de `UPDATE` también exige
  `core.is_staff()`.
- La tabla es singleton: siempre se lee/actualiza
  `singleton_key = 'default'`; admin no crea ni elimina filas.

## Datos

| Grupo         | Campos                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------- |
| Contacto      | `whatsappE164`, `email`                                                                      |
| Yape          | `yapePhone`, `yapeHolderName`                                                                |
| Transferencia | `bankName`, `bankAccountHolderName`, `bankAccountNumber`, `bankInterbankAccountNumber` (CCI) |

`@de-tin-marin/validations/business-settings` valida: WhatsApp E.164 sin
`+`, móvil Yape peruano `9XXXXXXXX`, email, cuenta y CCI de 20 dígitos.

## Capas

```text
BusinessSettingsPageContainer
  → get/updateBusinessSettingsAction
    → business-settings.service
      → business-settings.repository
        → core.public_business_settings
```

El formulario usa borrador local y TanStack Query; después de guardar invalida
`["business-settings"]`.

## Consumidores ecommerce

La misma configuración se muestra públicamente en:

- Help FAB (WhatsApp).
- Nosotros, Términos y Política de privacidad (WhatsApp + email).
- Confirmación y lookup de órdenes `pending_payment` (Yape + transferencia).

Editar los datos cambia las instrucciones futuras visibles de órdenes
pendientes; no modifica `commerce.orders`, `payment_methods` ni
`commerce.payments`, ni confirma pagos.

## Seguridad

Los campos se publican deliberadamente para permitir el pago y contacto. No
guardar secretos, tokens, claves privadas ni datos que no deban verse en la
tienda.

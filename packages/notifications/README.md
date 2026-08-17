# `@de-tin-marin/notifications`

Envío SMTP server-only (Nodemailer) para notificaciones de órdenes.

## API

- `@de-tin-marin/notifications/notify-order-created` — `notifyOrderCreated`
- `@de-tin-marin/notifications/recipients` — parseo / dedupe de destinatarios
- `@de-tin-marin/notifications/smtp-config` — `resolveSmtpConfig`
- `@de-tin-marin/notifications/types` — DTOs allowlist

## Contrato

- Ecommerce: cliente + admin (`public_business_settings.email` + extras env).
- Admin create: solo admin.
- Sin SMTP completo → skip (`skipped: true`); no tumba create order.
- `notifyOrderCreated` devuelve `{ ok, sent, skipped }`; si un envío falla,
  devuelve `{ ok: false, sent }` y no propaga el error al creador de la orden.
- Extras: `ORDER_NOTIFY_EXTRA_EMAILS` admite coma, punto y coma o espacios;
  descarta emails inválidos y deduplica sin distinguir mayúsculas.
- Templates: `src/templates/*.html` + text plano.

El caller agenda la operación con `after()` después de persistir la orden. No
hay cola, reintento, webhook ni registro de entrega en v1; este paquete no
puede garantizar que un destinatario reciba el correo.

## Datos y privacidad

`OrderCreatedNotifyInput` es un DTO explícito, no una fila cruda. Incluye
identificadores/totales, contacto, resumen de fulfillment y líneas congeladas
de producto/pack/bundle. El correo administrativo puede mostrar ese detalle
operativo; no registrarlo en logs. Los helpers de app solo loguean
`orderId`, `orderNumber`, origen, `sent` y código de fallo.

Las URLs de ecommerce/admin son opcionales y se arman desde bases server-only.
Los links guest incluyen `orderNumber` y email, necesarios para el lookup sin
sesión; tratarlos como información personal al reenviar el correo.

## Templates

- Cliente: paleta marca (`#b60058` / confectionery), logo desde
  `{ORDER_ECOMMERCE_APP_BASE_URL}/brand/detinmarin-logo.png`, líneas, totales,
  fulfillment y CTA a `/pedido/confirmacion` (y link a Mis pedidos).
- Admin: detalle operativo + CTA absoluto a `/orders/{id}`.

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=...
SMTP_PASS=...   # App Password
SMTP_FROM="De Tin Marín <...@gmail.com>"
SMTP_REPLY_TO=detinmarindulcesyconfiteria@gmail.com
ORDER_NOTIFY_EXTRA_EMAILS=   # opcional; vacío en prod
ORDER_ECOMMERCE_APP_BASE_URL=  # opcional links Mis pedidos
ORDER_ADMIN_APP_BASE_URL=      # opcional links admin
```

Respuestas del cliente: si `SMTP_REPLY_TO` está definido, Nodemailer envía `Reply-To` a esa dirección (el From puede seguir siendo la cuenta SMTP de soporte).

No copiar secretos reales a `.env.example`, documentación, commits ni logs.

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
- Templates: HTML embebido en `src/templates/*.template.ts` + text plano.

El caller agenda la operación con `after()` después de persistir la orden. No
hay cola, reintento, webhook ni registro de entrega en v1; este paquete no
puede garantizar que un destinatario reciba el correo.

## Datos y privacidad

`OrderCreatedNotifyInput` es un DTO explícito, no una fila cruda. Incluye
identificadores/totales, contacto, resumen de fulfillment (`delivery` /
`pickup` / `pickup_point`) y líneas congeladas de producto/pack/bundle. El
correo administrativo puede mostrar ese detalle operativo; no registrarlo en
logs. Los helpers de app solo loguean `orderId`, `orderNumber`, origen,
`sent` y código de fallo.

Las URLs de ecommerce/admin son opcionales y se arman desde bases server-only.
Los links guest incluyen `orderNumber` y email, necesarios para el lookup sin
sesión; tratarlos como información personal al reenviar el correo.

## Templates (embebidos en el bundle)

- Cliente: `order-customer.template.ts` → `ORDER_CUSTOMER_HTML`.
- Admin: `order-admin.template.ts` → `ORDER_ADMIN_HTML`.
- `build-emails.ts` importa esas constantes; **no** lee `.html` del disco.
- Paleta marca (`#b60058`), logo CDN, líneas con componentes de sorpresa/combo,
  CTA a confirmación / admin.

### Por qué no `readFileSync` + `.html`

En Vercel (Next.js serverless) los `.html` sueltos de un package **no** viajan
con el bundle. Un `readFileSync` al cargar el módulo falla con `ENOENT`. Ese
crash al importar `@de-tin-marin/notifications` también tumbaba el chunk de
`/checkout` (p. ej. no cargaban los distritos), aunque el email no se hubiera
enviado todavía.

**Regla del paquete:** todo asset runtime (plantillas, strings grandes) debe
importarse como módulo TypeScript/JS para que webpack lo empaquete. No depender
de `outputFileTracingIncludes` como fix primario; el tracing es frágil y no
sustituye embebido. Ver
[`docs/coding-guidelines.md`](../../docs/coding-guidelines.md) § Assets en
serverless / Vercel.

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...   # App Password
SMTP_FROM="De Tin Marín <...@gmail.com>"
SMTP_REPLY_TO=detinmarindulcesyconfiteria@gmail.com
ORDER_NOTIFY_EXTRA_EMAILS=   # opcional; vacío en prod
ORDER_ECOMMERCE_APP_BASE_URL=  # opcional links Mis pedidos
ORDER_ADMIN_APP_BASE_URL=      # opcional links admin
```

Transporter: `secure: false` + `requireTLS` (STARTTLS en 587), `family: 4`
(IPv4) y timeouts de conexión/greeting.

Respuestas del cliente: si `SMTP_REPLY_TO` está definido, Nodemailer envía
`Reply-To` a esa dirección (el From puede seguir siendo la cuenta SMTP de
soporte).

No copiar secretos reales a `.env.example`, documentación, commits ni logs.

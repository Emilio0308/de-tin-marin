# S3A-4 · Confirmación y mis pedidos (guest)

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| **Etapa**      | S3A-4 — Post-checkout guest ([roadmap.md](../../roadmap.md) § S3A) |
| **Owner**      | Equipo De Tin Marín                                                |
| **App(s)**     | `apps/ecommerce`, `supabase`                                       |
| **Schemas**    | `commerce`                                                         |
| **Depende de** | [S3A-3/03-cart-checkout.md](03-cart-checkout.md)                   |
| **Estado**     | draft                                                              |

## Contexto (leer esto, no todo docs/)

- S3A-3 crea orden guest y redirige con `orderNumber`.
- Sin auth S4: consulta pedido por **email + número de orden** (no exponer todas las órdenes).
- Pago v1 manual: pantalla con instrucciones Yape/transferencia (texto i18n estático configurable luego en S4 Settings).
- RLS guest no permite `SELECT` libre → RPC **`commerce.get_guest_order(p_order_number, p_email)`** SECURITY DEFINER.

## Objetivo

Tras checkout, el cliente ve confirmación con número de pedido e instrucciones de pago; puede consultar el estado de su pedido en “Mis pedidos” sin cuenta.

## Scope IN

- `/pedido/confirmacion?orderNumber=TM-...` — resumen: total, shipping, líneas resumidas, estado `pending_payment`, instrucciones de pago
- `/mis-pedidos` — formulario email + número de orden → detalle readonly
- Migración (misma `00011` o `00012`):
  - `commerce.get_guest_order(p_order_number text, p_email text) returns jsonb`
  - Valida email case-insensitive contra `orders.contact->>'email'`
  - Retorna DTO allowlist (sin `payment_methods` sensibles innecesarios)
  - `GRANT EXECUTE` a `anon, authenticated`
- Limpiar carrito localStorage tras orden exitosa (desde confirmación o post-create redirect)
- i18n — confirmación, instrucciones pago, estados orden, errores “no encontrado”
- Vitest — parser DTO guest order
- Playwright — `guest-order-lookup-smoke.spec.ts`: crear orden (fixture o UI) + consultar en mis-pedidos

## Scope OUT (traps)

- **NO login / registro** → S4
- **NO cancelar pedido desde ecommerce** v1
- **NO pagar online**
- **NO listar historial por email solo** (requiere siempre orderNumber + email)
- **NO notificaciones email** → S4
- **NO `index.ts` barrels**

## Tablas y RLS

| Objeto                     | ¿Nueva? | pgTAP                        |
| -------------------------- | ------- | ---------------------------- |
| `commerce.get_guest_order` | sí      | `commerce__guest_orders.sql` |

## Boundaries y DTOs

| Boundary        | Tipo          | Input                    | Output                             |
| --------------- | ------------- | ------------------------ | ---------------------------------- |
| `getGuestOrder` | Server Action | `{ orderNumber, email }` | `GuestOrderDetailDTO \| NOT_FOUND` |

`GuestOrderDetailDTO` allowlist:

```typescript
{
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  createdAt: string;
  fulfillment: { method; deliveryAddress? };
  shoppingCart: { lines: /* resumen */ };
}
```

## Rules que aplican

- Reglas **13, 16, 17**
- DECISIONS **#8, #26**

## Orden de implementación

1. RPC `get_guest_order` + pgTAP (email mismatch → not found)
2. Action + página confirmación
3. Página mis-pedidos
4. Limpiar carrito + nav link
5. Playwright end-to-end S3A completo
6. Actualizar `roadmap.md` S3A ✅
7. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] Confirmación muestra número de orden y total correctos
- [ ] Instrucciones de pago visibles en español
- [ ] Mis pedidos: combinación correcta email+orderNumber devuelve detalle
- [ ] Email incorrecto → error genérico (no filtrar existencia)
- [ ] Carrito vacío tras compra exitosa
- [ ] Playwright — lookup guest verde
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- **Texto instrucciones pago:** hardcode i18n v1; mover a `core.settings` en S4 si se desea.

## Depends on

- [03-cart-checkout.md](03-cart-checkout.md)

## Bloquea

- S3B / S4 (cuentas cliente con historial autenticado)

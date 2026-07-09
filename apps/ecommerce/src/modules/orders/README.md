# Módulo `orders`

Confirmación post-compra y consulta de pedido guest (S3A-4).

## Rutas

- `/pedido/confirmacion?orderNumber=TM-...&email=...` — requiere ambos params (RPC sin sesión)
- `/mis-pedidos` — auto-lookup si la URL incluye `orderNumber` + `email`

## Boundaries

| Action / Service      | Descripción                                      |
| --------------------- | ------------------------------------------------ |
| `getGuestOrderAction` | Lookup guest por `orderNumber` + `email` vía RPC |

## RPC

`commerce.get_guest_order(p_order_number, p_email)` — SECURITY DEFINER, email case-insensitive.

## Componentes

| Carpeta                    | Rol                                                     |
| -------------------------- | ------------------------------------------------------- |
| `guest-order-detail/`      | Resumen readonly compartido + instrucciones pago        |
| `order-confirmation-page/` | Post-checkout (instrucciones solo si `pending_payment`) |
| `guest-order-lookup-page/` | Formulario Mis pedidos + auto-lookup con query params   |

## Carrito

Se vacía en **checkout** justo después de `createGuestOrder` exitoso (antes de redirigir), no al resolver el RPC en confirmación.

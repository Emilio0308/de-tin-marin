# 10 — Auth y autorización

> **Alcance:** Verificación de identidad, ownership, roles staff vs cliente.

## Roles

| Rol           | Superficie | Acceso                                    |
| ------------- | ---------- | ----------------------------------------- |
| `customer`    | ecommerce  | Propias órdenes, perfil                   |
| `admin`       | admin      | Operaciones catálogo, órdenes, inventario |
| `super_admin` | admin      | Users, settings, overrides                |

Roles staff en `core.user_roles` o `app_metadata` (definir en migración S0).

## Reglas

### Re-verificar en cada Server Action

Un guard en `layout.tsx` **no protege** el endpoint de la action.

```typescript
"use server";
import { getUser } from "@de-tin-marin/db";

export async function updateProduct(id: string, input: unknown) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  // ownership / role check...
}
```

**Nunca `getSession()`** — usar `getUser()` o `getClaims()`.

### Ownership antes de mutar

Cargar el recurso; verificar que el caller puede actuar. En paths `service_role`, este check es la **única** defensa (invariante 2).

### RLS es la frontera real

Checks en app son defense-in-depth. La autorización definitiva está en Postgres — ver [`30-rls-and-postgres.md`](30-rls-and-postgres.md).

### Cliente solo ve lo suyo

`commerce.orders`: policy `customer_id = auth.uid()` o vía profile link.

### Staff vía rol

Policies que verifican rol admin en `core.user_roles` o claim verificado.

## Bug classes prevenidos

- Cookie spoofing (`getSession`)
- IDOR (actuar sobre recurso ajeno)
- Privilege escalation (cliente accediendo admin)

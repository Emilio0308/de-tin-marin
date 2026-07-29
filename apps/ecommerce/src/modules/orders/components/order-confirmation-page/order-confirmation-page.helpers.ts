export function hasConfirmationLookupParams(
  orderNumber: string | null,
  email: string | null,
): boolean {
  return Boolean(orderNumber?.trim() && email?.trim());
}

export function resolveConfirmationLookupParams(
  orderNumber: string | null,
  email: string | null,
): { orderNumber: string | null; email: string | null } {
  return {
    orderNumber: orderNumber?.trim() ?? null,
    email: email?.trim() ?? null,
  };
}

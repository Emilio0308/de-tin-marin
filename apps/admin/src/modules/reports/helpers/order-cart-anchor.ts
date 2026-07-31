/** Nombre de ancla Excel-safe a partir del order_number. */
export function orderCartAnchorName(orderNumber: string): string {
  const sanitized = orderNumber.replace(/[^A-Za-z0-9]/g, "_");
  return `Orden_${sanitized || "sin_numero"}`;
}

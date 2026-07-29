export function resolveComponentTotalQuantity(
  quantityPerUnit: number,
  personCount: number,
): number {
  return quantityPerUnit * personCount;
}

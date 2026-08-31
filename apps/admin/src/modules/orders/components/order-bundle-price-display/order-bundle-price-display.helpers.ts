export function bundlePriceTotalsDiffer(
  rawTotal: number,
  chargeableTotal: number,
): boolean {
  return Math.abs(rawTotal - chargeableTotal) > 0.005;
}

export function formatAdminMoney(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

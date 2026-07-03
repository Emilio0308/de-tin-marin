/** Formatea un precio numérico a la forma de visualización "$5.50". */
export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

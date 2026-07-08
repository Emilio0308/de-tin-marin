/** Formatea un precio numérico a la forma de visualización "$5.50". */
export function formatPrice(value: number): string {
  return `S/${value.toFixed(2)}`;
}

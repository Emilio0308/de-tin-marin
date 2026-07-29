import { coerceMoney } from "@de-tin-marin/shared/prices";

/** Formatea un precio numérico a la forma de visualización "S/5.50". */
export function formatPrice(value: number | null | undefined): string {
  return `S/${coerceMoney(value).toFixed(2)}`;
}

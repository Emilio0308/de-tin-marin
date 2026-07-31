import { roundMoney } from "./prices";

export type ProductMarginInput = {
  saleNetPrice: number;
  costNetPrice: number | null | undefined;
};

export type ProductMarginResult = {
  margin: number | null;
  marginPct: number | null;
};

/** Margen vs precio de venta (normal); % = margen / costo. */
export function computeProductMargin(
  input: ProductMarginInput,
): ProductMarginResult {
  const cost = input.costNetPrice;
  if (cost === null || cost === undefined || cost <= 0) {
    return { margin: null, marginPct: null };
  }

  const margin = roundMoney(input.saleNetPrice - cost);
  const marginPct = roundMoney(margin / cost);

  return { margin, marginPct };
}

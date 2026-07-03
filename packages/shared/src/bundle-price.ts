import { roundMoney } from "./prices";

export type BundlePriceItem = {
  unitNetPrice: number;
  unitsPerPerson: number;
};

export type BundlePriceInput = {
  serviceFee: number;
  quantity: number;
  items: BundlePriceItem[];
};

export type BundlePriceResult = {
  itemsSubtotal: number;
  total: number;
};

export function computeBundleTotal(input: BundlePriceInput): BundlePriceResult {
  const itemsSubtotal = roundMoney(
    input.items.reduce(
      (sum, item) => sum + item.unitNetPrice * item.unitsPerPerson,
      0,
    ),
  );
  const total = roundMoney(input.serviceFee + input.quantity * itemsSubtotal);
  return { itemsSubtotal, total };
}

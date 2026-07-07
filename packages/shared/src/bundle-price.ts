import { roundMoney } from "./prices";

export type BundlePriceItem = {
  unitNetPrice: number;
  unitsPerPerson: number;
};

export type BundlePriceInput = {
  containerNetPrice: number;
  quantity: number;
  items: BundlePriceItem[];
};

export type BundlePriceResult = {
  itemsSubtotal: number;
  containerSubtotal: number;
  total: number;
};

export function computeBundleTotal(input: BundlePriceInput): BundlePriceResult {
  const itemsSubtotal = roundMoney(
    input.items.reduce(
      (sum, item) => sum + item.unitNetPrice * item.unitsPerPerson,
      0,
    ),
  );
  const containerSubtotal = roundMoney(
    input.containerNetPrice * input.quantity,
  );
  const total = roundMoney(
    input.quantity * (input.containerNetPrice + itemsSubtotal),
  );
  return { itemsSubtotal, containerSubtotal, total };
}

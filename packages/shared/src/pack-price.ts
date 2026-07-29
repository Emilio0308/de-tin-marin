import { roundMoney } from "./prices";

export type PackPriceItem = {
  packageNetPrice: number;
  packageQuantity: number;
};

export type PackPriceResult = {
  referenceNetPrice: number;
};

export function computePackReference(items: PackPriceItem[]): PackPriceResult {
  const referenceNetPrice = roundMoney(
    items.reduce(
      (sum, item) => sum + item.packageNetPrice * item.packageQuantity,
      0,
    ),
  );
  return { referenceNetPrice };
}

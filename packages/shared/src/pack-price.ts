import { roundMoney } from "./prices";

export type PackPriceItem = {
  packageNetPrice: number;
  unitNetPrice: number;
  packageQuantity: number;
  unitQuantity: number;
};

export type PackPriceResult = {
  referenceNetPrice: number;
};

export function computePackReference(items: PackPriceItem[]): PackPriceResult {
  const referenceNetPrice = roundMoney(
    items.reduce(
      (sum, item) =>
        sum +
        item.packageNetPrice * item.packageQuantity +
        item.unitNetPrice * item.unitQuantity,
      0,
    ),
  );
  return { referenceNetPrice };
}

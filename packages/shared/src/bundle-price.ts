import { roundMoney } from "./prices";

/** Default commercial price step for bundle per-surprise normalization (S/). */
export const DEFAULT_BUNDLE_PRICE_STEP = 0.5;

export type BundlePriceItem = {
  unitNetPrice: number;
  unitsPerPerson: number;
};

export type BundlePriceInput = {
  containerNetPrice: number;
  quantity: number;
  items: BundlePriceItem[];
  step?: number;
};

export type BundlePerSurprisePrice = {
  itemsSubtotal: number;
  rawPerSurprisePrice: number;
  normalizedPerSurprisePrice: number;
};

export type BundlePriceResult = BundlePerSurprisePrice & {
  containerSubtotal: number;
  /** Raw line total (quantity × rawPerSurprisePrice). */
  lineTotal: number;
  normalizedLineTotal: number;
  /** Alias of normalizedLineTotal for catalog call-sites. */
  total: number;
};

export type BundlePerSurprisePriceInput = {
  containerNetPrice: number;
  items: BundlePriceItem[];
  step?: number;
};

/** Ceil to the next multiple of `step` (e.g. 10.15 → 10.5 with step 0.5). */
export function normalizeBundlePrice(
  rawPerSurprise: number,
  step: number = DEFAULT_BUNDLE_PRICE_STEP,
): number {
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error("INVALID_BUNDLE_PRICE_STEP");
  }
  const safeRaw = Math.max(0, rawPerSurprise);
  if (safeRaw === 0) return 0;
  return roundMoney(Math.ceil(safeRaw / step) * step);
}

export function computeBundlePerSurprisePrice(
  input: BundlePerSurprisePriceInput,
): BundlePerSurprisePrice {
  const step = input.step ?? DEFAULT_BUNDLE_PRICE_STEP;
  const itemsSubtotal = roundMoney(
    input.items.reduce(
      (sum, item) => sum + item.unitNetPrice * item.unitsPerPerson,
      0,
    ),
  );
  const rawPerSurprisePrice = roundMoney(
    input.containerNetPrice + itemsSubtotal,
  );
  const normalizedPerSurprisePrice = normalizeBundlePrice(
    rawPerSurprisePrice,
    step,
  );

  return {
    itemsSubtotal,
    rawPerSurprisePrice,
    normalizedPerSurprisePrice,
  };
}

export function computeBundleTotal(input: BundlePriceInput): BundlePriceResult {
  const quantity = Math.max(0, Math.floor(input.quantity));
  const perSurprise = computeBundlePerSurprisePrice({
    containerNetPrice: input.containerNetPrice,
    items: input.items,
    step: input.step,
  });
  const containerSubtotal = roundMoney(input.containerNetPrice * quantity);
  const lineTotal = roundMoney(quantity * perSurprise.rawPerSurprisePrice);
  const normalizedLineTotal = roundMoney(
    quantity * perSurprise.normalizedPerSurprisePrice,
  );

  return {
    ...perSurprise,
    containerSubtotal,
    lineTotal,
    normalizedLineTotal,
    total: normalizedLineTotal,
  };
}

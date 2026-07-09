export const IGV_RATE = 0.18;

export type PriceNormal = {
  netPrice: number;
  igv: number;
  subtotal: number;
};

export type Prices = {
  normal: PriceNormal;
  unit: PriceNormal;
  suggested: Record<string, unknown>;
  fantasy: Record<string, unknown>;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convierte valores corruptos o ausentes en un monto finito redondeado. */
export function coerceMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return roundMoney(value);
  }
  return 0;
}

function buildPriceBlock(netPrice: number): PriceNormal {
  const roundedNet = roundMoney(netPrice);
  const subtotal = roundMoney(roundedNet / (1 + IGV_RATE));
  const igv = roundMoney(roundedNet - subtotal);
  return { netPrice: roundedNet, igv, subtotal };
}

export function buildPricesFromPackageNetPrice(
  packageNetPrice: number,
  itemsPerPackage: number,
): Prices {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));

  if (safeItems === 1) {
    const block = buildPriceBlock(packageNetPrice);
    return { normal: block, unit: block, suggested: {}, fantasy: {} };
  }

  const unitNet = roundMoney(packageNetPrice / safeItems);
  const unit = buildPriceBlock(unitNet);
  const normal = buildPriceBlock(roundMoney(unitNet * safeItems));
  return { normal, unit, suggested: {}, fantasy: {} };
}

export function buildPricesFromNetPrice(netPrice: number): Prices {
  return buildPricesFromPackageNetPrice(netPrice, 1);
}

export function buildSinglePriceFromNetPrice(netPrice: number): PriceNormal {
  return buildPriceBlock(netPrice);
}

function readNetPrice(value: unknown): number | null {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "netPrice" in value &&
    typeof value.netPrice === "number"
  ) {
    return value.netPrice;
  }

  return null;
}

export function parseProductPricesJson(prices: unknown): {
  packageNetPrice: number;
  unitNetPrice: number;
} {
  if (typeof prices !== "object" || prices === null || Array.isArray(prices)) {
    return { packageNetPrice: 0, unitNetPrice: 0 };
  }

  const record = prices as Record<string, unknown>;
  const packageNetPrice = readNetPrice(record.normal) ?? 0;
  const unitNetPrice = readNetPrice(record.unit) ?? packageNetPrice;

  return { packageNetPrice, unitNetPrice };
}

export function parseContainerPricesJson(prices: unknown): {
  netPrice: number;
} {
  if (typeof prices !== "object" || prices === null || Array.isArray(prices)) {
    return { netPrice: 0 };
  }

  const record = prices as Record<string, unknown>;
  return {
    netPrice:
      typeof record.netPrice === "number"
        ? record.netPrice
        : Number(record.netPrice ?? 0),
  };
}

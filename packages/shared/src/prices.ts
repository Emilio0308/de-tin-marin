export const IGV_RATE = 0.18;

export type PriceNormal = {
  netPrice: number;
  igv: number;
  subtotal: number;
};

export type Prices = {
  normal: PriceNormal;
  suggested: Record<string, unknown>;
  fantasy: Record<string, unknown>;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildPricesFromNetPrice(netPrice: number): Prices {
  const subtotal = roundMoney(netPrice / (1 + IGV_RATE));
  const igv = roundMoney(netPrice - subtotal);
  const normal: PriceNormal = { netPrice: roundMoney(netPrice), igv, subtotal };
  return { normal, suggested: {}, fantasy: {} };
}

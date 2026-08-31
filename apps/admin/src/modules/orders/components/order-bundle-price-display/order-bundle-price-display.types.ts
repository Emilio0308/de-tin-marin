export type OrderBundlePriceDisplayLabels = {
  formatTheoreticalTotal: (price: string) => string;
  formatPerSurprisePrice: (chargeable: string, theoretical: string) => string;
};

export type OrderBundlePriceDisplayProps = {
  chargeableTotal: number;
  rawTotal: number;
  quantity: number;
  labels: OrderBundlePriceDisplayLabels;
  /** `detail` = línea de carrito; `summary` = bloque de totales en modal */
  variant?: "detail" | "summary";
  className?: string;
};

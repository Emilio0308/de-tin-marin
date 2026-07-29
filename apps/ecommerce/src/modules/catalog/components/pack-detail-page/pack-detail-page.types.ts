import type { PublicPackDetail } from "@de-tin-marin/validations/public-catalog";

/** Labels serializables desde Server Component → Client. */
export type PackDetailStaticLabels = {
  back: string;
  sku: string;
  includes: string;
  addToCart: string;
  description: string;
  unavailable: string;
  decreaseQuantity: string;
  increaseQuantity: string;
};

export type PackDetailPageLabels = PackDetailStaticLabels & {
  formatComponentPackages: (packages: number, units: number) => string;
  formatComponentUnits: (count: number) => string;
};

export type PackDetailPageProps = {
  pack: PublicPackDetail;
  labels: PackDetailPageLabels;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  purchasable: boolean;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onAddToCart?: () => void;
};

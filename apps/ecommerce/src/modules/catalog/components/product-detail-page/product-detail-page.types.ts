import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";

export type ProductDetailPageLabels = {
  back: string;
  sku: string;
  category: string;
  stock: string;
  addToCart: string;
  description: string;
  packageBadge: string | null;
  decreaseQuantity: string;
  increaseQuantity: string;
};

export type ProductDetailPageProps = {
  product: PublicProductDetail;
  labels: ProductDetailPageLabels;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  purchasable: boolean;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onAddToCart?: () => void;
};

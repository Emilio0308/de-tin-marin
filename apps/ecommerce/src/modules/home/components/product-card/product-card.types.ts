import type { HomeProduct } from "@/modules/home/types/home.types";

export interface ProductCardProps {
  product: HomeProduct;
  addToCartLabel?: string;
  detailHref?: string;
  canAddToCart?: boolean;
  onAddToCart?: () => void;
}

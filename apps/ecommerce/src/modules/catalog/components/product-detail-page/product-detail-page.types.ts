import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";

export type ProductDetailSuggestedItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  finalPrice: number;
};

export type ProductDetailPageLabels = {
  back: string;
  dulces: string;
  sku: string;
  category: string;
  quantity: string;
  availability: string;
  inStock: string;
  outOfStock: string;
  addToCart: string;
  description: string;
  productTypeLabel: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  relatedTitle: string;
  relatedSubtitle: string;
  viewAll: string;
  completeGiftTitle: string;
  whyTitle: string;
  highlightArtisanal: string;
  highlightFresh: string;
  highlightShipping: string;
  whyFruit: string;
  whyTexture: string;
  whyGift: string;
  whyLove: string;
};

export type ProductDetailPageProps = {
  product: PublicProductDetail;
  suggestions: ProductDetailSuggestedItem[];
  labels: ProductDetailPageLabels;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  purchasable: boolean;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onAddToCart?: () => void;
};

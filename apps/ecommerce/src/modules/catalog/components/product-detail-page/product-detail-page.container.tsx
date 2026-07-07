"use client";

import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { ProductDetailPage } from "./product-detail-page";

export type ProductDetailPageContainerProps = {
  product: PublicProductDetail;
  labels: {
    back: string;
    sku: string;
    category: string;
    stock: string;
    addToCart: string;
    description: string;
  };
};

export function ProductDetailPageContainer({
  product,
  labels,
}: ProductDetailPageContainerProps) {
  const { addProduct } = useCart();

  return (
    <ProductDetailPage
      product={product}
      labels={labels}
      onAddToCart={() => addProduct(product)}
    />
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ProductDetailPageLabels } from "./product-detail-page.types";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { resolveProductPurchaseLimits } from "./product-detail-page.helpers";
import { ProductDetailPage } from "./product-detail-page";

export type ProductDetailPageContainerProps = {
  product: PublicProductDetail;
  labels: ProductDetailPageLabels;
};

export function ProductDetailPageContainer({
  product,
  labels,
}: ProductDetailPageContainerProps) {
  const { addProduct } = useCart();
  const bounds = useMemo(
    () => resolveProductPurchaseLimits(product),
    [product],
  );
  const [quantity, setQuantity] = useState(bounds.minQuantity);

  function handleDecreaseQuantity() {
    setQuantity((current) => Math.max(bounds.minQuantity, current - 1));
  }

  function handleIncreaseQuantity() {
    setQuantity((current) => Math.min(bounds.maxQuantity, current + 1));
  }

  function handleAddToCart() {
    if (!bounds.purchasable) return;
    addProduct(product, quantity);
    setQuantity(bounds.minQuantity);
  }

  return (
    <ProductDetailPage
      product={product}
      labels={labels}
      quantity={quantity}
      minQuantity={bounds.minQuantity}
      maxQuantity={bounds.maxQuantity}
      purchasable={bounds.purchasable}
      onDecreaseQuantity={handleDecreaseQuantity}
      onIncreaseQuantity={handleIncreaseQuantity}
      onAddToCart={bounds.purchasable ? handleAddToCart : undefined}
    />
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ProductDetailPageLabels } from "./product-detail-page.types";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { resolveProductMaxQuantity } from "./product-detail-page.helpers";
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
  const maxQuantity = useMemo(
    () => resolveProductMaxQuantity(product),
    [product],
  );
  const [quantity, setQuantity] = useState(1);

  function handleDecreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function handleIncreaseQuantity() {
    setQuantity((current) => Math.min(maxQuantity, current + 1));
  }

  function handleAddToCart() {
    addProduct(product, quantity);
    setQuantity(1);
  }

  return (
    <ProductDetailPage
      product={product}
      labels={labels}
      quantity={quantity}
      maxQuantity={maxQuantity}
      onDecreaseQuantity={handleDecreaseQuantity}
      onIncreaseQuantity={handleIncreaseQuantity}
      onAddToCart={handleAddToCart}
    />
  );
}

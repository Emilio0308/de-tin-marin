import {
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
  resolveProductPurchaseBounds,
  type ProductPurchaseBounds,
} from "@de-tin-marin/shared/product-purchase-limits";
import type { OrderFormLine, ProductOption } from "./order-form.types";

export function resolveOrderFormProductBounds(
  product: ProductOption,
): ProductPurchaseBounds {
  return resolveProductPurchaseBounds({
    productType: product.productType,
    itemsPerPackage: product.itemsPerPackage,
    stockTotalBaseUnits: product.stockTotalBaseUnits,
    purchaseMinQuantity: product.purchaseMinQuantity,
    purchaseMaxQuantity: product.purchaseMaxQuantity,
  });
}

export function mergeOrAddProductLine(
  lines: OrderFormLine[],
  productId: string,
  quantity: number,
  product: ProductOption,
): OrderFormLine[] {
  const bounds = resolveOrderFormProductBounds(product);
  const safeQuantity = clampProductPurchaseQuantity(quantity, bounds);
  const existingIndex = lines.findIndex(
    (line) => line.type === "product" && line.productId === productId,
  );

  if (existingIndex === -1) {
    return [...lines, { type: "product", productId, quantity: safeQuantity }];
  }

  const existing = lines[existingIndex];
  if (!existing || existing.type !== "product") return lines;

  const mergedQuantity = mergeProductPurchaseQuantity(
    existing.quantity,
    safeQuantity,
    bounds,
  );

  return lines.map((line, index) =>
    index === existingIndex && line.type === "product"
      ? { ...line, quantity: mergedQuantity }
      : line,
  );
}

export function updateProductLineQuantity(
  lines: OrderFormLine[],
  index: number,
  quantity: number,
  product: ProductOption,
): OrderFormLine[] {
  const line = lines[index];
  if (!line || line.type !== "product") return lines;

  const bounds = resolveOrderFormProductBounds(product);
  const safeQuantity = clampProductPurchaseQuantity(quantity, bounds);

  return lines.map((current, lineIndex) =>
    lineIndex === index && current.type === "product"
      ? { ...current, quantity: safeQuantity }
      : current,
  );
}

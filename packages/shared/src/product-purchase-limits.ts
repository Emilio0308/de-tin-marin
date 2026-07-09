export type ProductPurchaseLimitInput = {
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockTotalBaseUnits: number;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
};

export type ProductPurchaseBounds = {
  minQuantity: number;
  maxQuantity: number;
  purchasable: boolean;
};

export function resolveStockInPresentations(input: {
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockTotalBaseUnits: number;
}): number {
  if (input.stockTotalBaseUnits <= 0) return 0;

  if (input.productType === "package" && input.itemsPerPackage > 0) {
    return Math.floor(input.stockTotalBaseUnits / input.itemsPerPackage);
  }

  return input.stockTotalBaseUnits;
}

export function resolveProductPurchaseBounds(
  input: ProductPurchaseLimitInput,
): ProductPurchaseBounds {
  const minQuantity = Math.max(1, Math.floor(input.purchaseMinQuantity));
  const configuredMax = Math.max(
    minQuantity,
    Math.floor(input.purchaseMaxQuantity),
  );
  const stockInPresentations = resolveStockInPresentations({
    productType: input.productType,
    itemsPerPackage: input.itemsPerPackage,
    stockTotalBaseUnits: input.stockTotalBaseUnits,
  });

  if (stockInPresentations < minQuantity) {
    return {
      minQuantity,
      maxQuantity: minQuantity,
      purchasable: false,
    };
  }

  const maxQuantity = Math.min(configuredMax, stockInPresentations);

  return {
    minQuantity,
    maxQuantity,
    purchasable: maxQuantity >= minQuantity,
  };
}

export function clampProductPurchaseQuantity(
  quantity: number,
  bounds: ProductPurchaseBounds,
): number {
  if (!bounds.purchasable) return bounds.minQuantity;
  const safeQuantity = Math.floor(quantity);
  return Math.min(
    bounds.maxQuantity,
    Math.max(bounds.minQuantity, safeQuantity),
  );
}

export function mergeProductPurchaseQuantity(
  currentQuantity: number,
  addedQuantity: number,
  bounds: ProductPurchaseBounds,
): number {
  if (!bounds.purchasable) return currentQuantity;
  return clampProductPurchaseQuantity(currentQuantity + addedQuantity, bounds);
}

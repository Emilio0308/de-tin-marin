import { normalizeProductLineQuantities } from "./order-cart";

export type ProductPurchaseMode = "customer" | "admin";

export type ProductPurchaseLimitInput = {
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockTotalBaseUnits: number;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
  /** Default `"customer"`. Admin ignores purchase min/max; stock still caps qty. */
  mode?: ProductPurchaseMode;
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

export function productLineNeedBaseUnits(input: {
  packageQuantity: number;
  unitQuantity: number;
  itemsPerPackage: number;
}): number {
  const ipp = Math.max(1, Math.floor(input.itemsPerPackage));
  const normalized = normalizeProductLineQuantities(
    input.packageQuantity,
    input.unitQuantity,
    ipp,
  );
  return normalized.packageQuantity * ipp + normalized.unitQuantity;
}

/** Clamp dual qty so needBase ≤ availableBase (admin product lines). */
export function clampProductDualQuantities(input: {
  packageQuantity: number;
  unitQuantity: number;
  itemsPerPackage: number;
  availableBaseUnits: number;
}): { packageQuantity: number; unitQuantity: number } {
  const ipp = Math.max(1, Math.floor(input.itemsPerPackage));
  const available = Math.max(0, Math.floor(input.availableBaseUnits));
  const normalized = normalizeProductLineQuantities(
    input.packageQuantity,
    input.unitQuantity,
    ipp,
  );
  const need = normalized.packageQuantity * ipp + normalized.unitQuantity;
  if (need <= available) {
    return normalized;
  }
  return {
    packageQuantity: Math.floor(available / ipp),
    unitQuantity: available % ipp,
  };
}

export function resolveAdminProductDualPurchasable(
  availableBaseUnits: number,
): boolean {
  return Math.floor(availableBaseUnits) >= 1;
}

export function resolveProductPurchaseBounds(
  input: ProductPurchaseLimitInput,
): ProductPurchaseBounds {
  const stockInPresentations = resolveStockInPresentations({
    productType: input.productType,
    itemsPerPackage: input.itemsPerPackage,
    stockTotalBaseUnits: input.stockTotalBaseUnits,
  });

  if (input.mode === "admin") {
    if (stockInPresentations < 1) {
      return {
        minQuantity: 1,
        maxQuantity: 1,
        purchasable: false,
      };
    }

    return {
      minQuantity: 1,
      maxQuantity: stockInPresentations,
      purchasable: true,
    };
  }

  const minQuantity = Math.max(1, Math.floor(input.purchaseMinQuantity));
  const configuredMax = Math.max(
    minQuantity,
    Math.floor(input.purchaseMaxQuantity),
  );

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

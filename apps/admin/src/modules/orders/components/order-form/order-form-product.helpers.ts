import {
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
  resolveProductPurchaseBounds,
  resolveStockInPresentations,
  type ProductPurchaseBounds,
} from "@de-tin-marin/shared/product-purchase-limits";
import type {
  OrderFormLine,
  PackOption,
  ProductOption,
} from "./order-form.types";

export function resolveOrderFormProductBounds(
  product: ProductOption,
): ProductPurchaseBounds {
  return resolveProductPurchaseBounds({
    productType: product.productType,
    itemsPerPackage: product.itemsPerPackage,
    stockTotalBaseUnits: product.stockTotalBaseUnits,
    purchaseMinQuantity: product.purchaseMinQuantity,
    purchaseMaxQuantity: product.purchaseMaxQuantity,
    mode: "admin",
  });
}

export function resolveOrderFormPackBounds(
  pack: PackOption,
): ProductPurchaseBounds {
  return resolveProductPurchaseBounds({
    productType: "unit",
    itemsPerPackage: 1,
    stockTotalBaseUnits: pack.availableQuantity,
    purchaseMinQuantity: pack.purchaseMinQuantity,
    purchaseMaxQuantity: pack.purchaseMaxQuantity,
    mode: "admin",
  });
}

export type ProductAddBlockReason =
  | { code: "NO_SELECTION" }
  | {
      code: "OUT_OF_STOCK";
      minQuantity: number;
      available: number;
    };

export type PackAddBlockReason =
  | { code: "NO_SELECTION" }
  | {
      code: "OUT_OF_STOCK";
      minQuantity: number;
      available: number;
      stockShortages: PackOption["stockShortages"];
    };

export function resolveProductAddBlockReason(
  product: ProductOption | undefined,
  bounds: ProductPurchaseBounds | null,
): ProductAddBlockReason | null {
  if (!product || !bounds) return { code: "NO_SELECTION" };
  if (bounds.purchasable) return null;

  return {
    code: "OUT_OF_STOCK",
    minQuantity: bounds.minQuantity,
    available: resolveStockInPresentations({
      productType: product.productType,
      itemsPerPackage: product.itemsPerPackage,
      stockTotalBaseUnits: product.stockTotalBaseUnits,
    }),
  };
}

export function resolvePackAddBlockReason(
  pack: PackOption | undefined,
  bounds: ProductPurchaseBounds | null,
): PackAddBlockReason | null {
  if (!pack || !bounds) return { code: "NO_SELECTION" };
  if (bounds.purchasable) return null;

  return {
    code: "OUT_OF_STOCK",
    minQuantity: bounds.minQuantity,
    available: Math.max(0, Math.floor(pack.availableQuantity)),
    stockShortages: pack.stockShortages,
  };
}

export function clampOrderFormPackQuantity(
  quantity: number,
  pack: PackOption,
): number {
  return clampProductPurchaseQuantity(
    quantity,
    resolveOrderFormPackBounds(pack),
  );
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

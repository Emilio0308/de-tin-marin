import {
  clampProductDualQuantities,
  clampProductPurchaseQuantity,
  resolveAdminProductDualPurchasable,
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

  if (product.productType === "package") {
    if (resolveAdminProductDualPurchasable(product.stockTotalBaseUnits)) {
      return null;
    }
    return {
      code: "OUT_OF_STOCK",
      minQuantity: 1,
      available: Math.max(0, Math.floor(product.stockTotalBaseUnits)),
    };
  }

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

function clampDualForProduct(
  packageQuantity: number,
  unitQuantity: number,
  product: ProductOption,
): { packageQuantity: number; unitQuantity: number } {
  if (product.productType === "unit") {
    const bounds = resolveOrderFormProductBounds(product);
    const safe = clampProductPurchaseQuantity(packageQuantity, bounds);
    return { packageQuantity: safe, unitQuantity: 0 };
  }

  return clampProductDualQuantities({
    packageQuantity,
    unitQuantity,
    itemsPerPackage: product.itemsPerPackage,
    availableBaseUnits: product.stockTotalBaseUnits,
  });
}

export function mergeOrAddProductLine(
  lines: OrderFormLine[],
  productId: string,
  packageQuantity: number,
  unitQuantity: number,
  product: ProductOption,
): OrderFormLine[] {
  const existingIndex = lines.findIndex(
    (line) => line.type === "product" && line.productId === productId,
  );

  if (existingIndex === -1) {
    const clamped = clampDualForProduct(packageQuantity, unitQuantity, product);
    if (clamped.packageQuantity + clamped.unitQuantity < 1) return lines;
    return [
      ...lines,
      {
        type: "product",
        productId,
        packageQuantity: clamped.packageQuantity,
        unitQuantity: clamped.unitQuantity,
      },
    ];
  }

  const existing = lines[existingIndex];
  if (!existing || existing.type !== "product") return lines;

  const clamped = clampDualForProduct(
    existing.packageQuantity + packageQuantity,
    existing.unitQuantity + unitQuantity,
    product,
  );

  if (clamped.packageQuantity + clamped.unitQuantity < 1) return lines;

  return lines.map((line, index) =>
    index === existingIndex && line.type === "product"
      ? {
          ...line,
          packageQuantity: clamped.packageQuantity,
          unitQuantity: clamped.unitQuantity,
        }
      : line,
  );
}

export function updateProductLineDualQuantity(
  lines: OrderFormLine[],
  index: number,
  packageQuantity: number,
  unitQuantity: number,
  product: ProductOption,
): OrderFormLine[] {
  const line = lines[index];
  if (!line || line.type !== "product") return lines;

  const clamped = clampDualForProduct(packageQuantity, unitQuantity, product);
  if (clamped.packageQuantity + clamped.unitQuantity < 1) {
    return lines;
  }

  return lines.map((current, lineIndex) =>
    lineIndex === index && current.type === "product"
      ? {
          ...current,
          packageQuantity: clamped.packageQuantity,
          unitQuantity: clamped.unitQuantity,
        }
      : current,
  );
}

/** @deprecated use updateProductLineDualQuantity */
export function updateProductLineQuantity(
  lines: OrderFormLine[],
  index: number,
  quantity: number,
  product: ProductOption,
): OrderFormLine[] {
  return updateProductLineDualQuantity(lines, index, quantity, 0, product);
}

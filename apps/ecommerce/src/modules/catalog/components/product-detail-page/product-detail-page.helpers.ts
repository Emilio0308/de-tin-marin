import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";

export function resolveProductMaxQuantity(
  product: PublicProductDetail,
): number {
  if (product.stockTotalBaseUnits <= 0) return 1;

  if (product.productType === "package" && product.itemsPerPackage > 0) {
    return Math.max(
      1,
      Math.floor(product.stockTotalBaseUnits / product.itemsPerPackage),
    );
  }

  return product.stockTotalBaseUnits;
}

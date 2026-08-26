import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";

export {
  isProductPurchasable,
  resolveProductMaxQuantity,
  resolveProductMinQuantity,
  resolveProductPurchaseLimits,
} from "@/modules/catalog/helpers/product-purchase-limits";

type ProductTypeLabelSource = Pick<
  PublicProductDetail,
  "productType" | "itemsPerPackage" | "packageLabel"
>;

export function resolveProductTypeLabel(
  product: ProductTypeLabelSource,
  labels: {
    productTypeUnit: string;
    packageUnits: (count: number) => string;
  },
): string {
  if (product.productType === "package") {
    return labels.packageUnits(Math.max(1, product.itemsPerPackage));
  }
  return labels.productTypeUnit;
}

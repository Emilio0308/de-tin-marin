import { resolveProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import type {
  PublicProductDetail,
  PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";

type ProductPurchaseSource = Pick<
  PublicProductListItem,
  | "productType"
  | "itemsPerPackage"
  | "stockTotalBaseUnits"
  | "purchaseMinQuantity"
  | "purchaseMaxQuantity"
>;

export function resolveProductPurchaseLimits(product: ProductPurchaseSource) {
  return resolveProductPurchaseBounds({
    productType: product.productType,
    itemsPerPackage: product.itemsPerPackage,
    stockTotalBaseUnits: product.stockTotalBaseUnits,
    purchaseMinQuantity: product.purchaseMinQuantity,
    purchaseMaxQuantity: product.purchaseMaxQuantity,
  });
}

export function resolveProductMaxQuantity(
  product: PublicProductDetail,
): number {
  return resolveProductPurchaseLimits(product).maxQuantity;
}

export function resolveProductMinQuantity(
  product: ProductPurchaseSource,
): number {
  return resolveProductPurchaseLimits(product).minQuantity;
}

export function isProductPurchasable(product: ProductPurchaseSource): boolean {
  return resolveProductPurchaseLimits(product).purchasable;
}

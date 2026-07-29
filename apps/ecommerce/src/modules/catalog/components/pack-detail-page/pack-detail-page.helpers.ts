import { resolveProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import type {
  PublicPackDetail,
  PublicPackListItem,
} from "@de-tin-marin/validations/public-catalog";

export function resolvePackPurchaseLimits(
  pack: Pick<
    PublicPackListItem,
    | "availableQuantity"
    | "purchaseMinQuantity"
    | "purchaseMaxQuantity"
    | "isPurchasable"
  >,
) {
  return resolveProductPurchaseBounds({
    productType: "unit",
    itemsPerPackage: 1,
    stockTotalBaseUnits: pack.availableQuantity,
    purchaseMinQuantity: pack.purchaseMinQuantity,
    purchaseMaxQuantity: pack.purchaseMaxQuantity,
  });
}

type PackComponentItem = PublicPackDetail["items"][number];

export function formatPackComponentQuantity(
  item: Pick<
    PackComponentItem,
    "packageQuantity" | "itemsPerPackage" | "productType"
  >,
  labels: {
    packagesOfUnits: (values: { packages: number; units: number }) => string;
    unitsOnly: (values: { count: number }) => string;
  },
): string {
  const packages = Math.max(1, Math.floor(item.packageQuantity));
  const unitsPerPackage = Math.max(1, Math.floor(item.itemsPerPackage));

  if (item.productType === "package" || unitsPerPackage > 1) {
    return labels.packagesOfUnits({
      packages,
      units: unitsPerPackage,
    });
  }

  return labels.unitsOnly({ count: packages });
}

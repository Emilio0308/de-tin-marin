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
    "packageQuantity" | "unitQuantity" | "itemsPerPackage" | "productType"
  >,
  labels: {
    packagesOfUnits: (values: { packages: number; units: number }) => string;
    unitsOnly: (values: { count: number }) => string;
    packagesAndLoose: (values: {
      packages: number;
      unitsPerPackage: number;
      loose: number;
    }) => string;
  },
): string {
  const packages = Math.max(0, Math.floor(item.packageQuantity));
  const loose = Math.max(0, Math.floor(item.unitQuantity));
  const unitsPerPackage = Math.max(1, Math.floor(item.itemsPerPackage));

  if (packages > 0 && loose > 0) {
    return labels.packagesAndLoose({
      packages,
      unitsPerPackage,
      loose,
    });
  }

  if (loose > 0 && packages === 0) {
    return labels.unitsOnly({ count: loose });
  }

  const safePackages = Math.max(1, packages);
  if (item.productType === "package" || unitsPerPackage > 1) {
    return labels.packagesOfUnits({
      packages: safePackages,
      units: unitsPerPackage,
    });
  }

  return labels.unitsOnly({ count: safePackages });
}

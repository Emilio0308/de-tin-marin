import { computeTotalBaseUnits } from "./product-stock";
import { resolveStockInPresentations } from "./product-purchase-limits";

export type PackAvailabilityProduct = {
  isActive: boolean;
  deletedAt: string | null;
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockSealedPackages: number;
  stockLooseBaseUnits: number;
};

export type PackAvailabilityComponent = {
  packageQuantity: number;
  product: PackAvailabilityProduct | null;
};

export function isActivePackAvailabilityComponent(
  component: PackAvailabilityComponent,
): boolean {
  const product = component.product;
  return Boolean(product?.isActive && product.deletedAt === null);
}

export function packComponentPresentations(
  product: PackAvailabilityProduct,
): number {
  const itemsPerPackage = Math.max(1, Math.floor(product.itemsPerPackage));
  const stockTotalBaseUnits =
    product.productType === "unit"
      ? product.stockLooseBaseUnits
      : computeTotalBaseUnits(
          product.stockSealedPackages,
          product.stockLooseBaseUnits,
          itemsPerPackage,
        );

  return resolveStockInPresentations({
    productType: product.productType,
    itemsPerPackage,
    stockTotalBaseUnits,
  });
}

/** Regla 22 — disponibilidad = min(floor(presentaciones / package_quantity)) sobre componentes activos. */
export function computePackAvailableQuantity(
  components: PackAvailabilityComponent[],
): number {
  const active = components.filter(isActivePackAvailabilityComponent);
  if (active.length === 0) return 0;

  let min = Number.POSITIVE_INFINITY;
  for (const item of active) {
    const product = item.product;
    if (!product) return 0;
    const presentations = packComponentPresentations(product);
    const packageQuantity = Math.max(1, Math.floor(item.packageQuantity));
    min = Math.min(min, Math.floor(presentations / packageQuantity));
  }

  return Number.isFinite(min) ? Math.max(0, min) : 0;
}

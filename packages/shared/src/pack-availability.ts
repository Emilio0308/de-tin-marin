import { computeTotalBaseUnits } from "./product-stock";

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
  unitQuantity: number;
  product: PackAvailabilityProduct | null;
};

export function isActivePackAvailabilityComponent(
  component: PackAvailabilityComponent,
): boolean {
  const product = component.product;
  return Boolean(product?.isActive && product.deletedAt === null);
}

/** Unidades base disponibles según product_type (Regla 4). */
export function packComponentAvailableBaseUnits(
  product: PackAvailabilityProduct,
): number {
  const itemsPerPackage = Math.max(1, Math.floor(product.itemsPerPackage));
  if (product.productType === "unit") {
    return Math.max(0, Math.floor(product.stockLooseBaseUnits));
  }
  return computeTotalBaseUnits(
    product.stockSealedPackages,
    product.stockLooseBaseUnits,
    itemsPerPackage,
  );
}

/** needBase por 1 combo = packageQuantity × ipp + unitQuantity. */
export function packComponentNeedBaseUnits(
  component: Pick<
    PackAvailabilityComponent,
    "packageQuantity" | "unitQuantity"
  >,
  itemsPerPackage: number,
): number {
  const ipp = Math.max(1, Math.floor(itemsPerPackage));
  const packageQuantity = Math.max(0, Math.floor(component.packageQuantity));
  const unitQuantity = Math.max(0, Math.floor(component.unitQuantity));
  return packageQuantity * ipp + unitQuantity;
}

/** @deprecated Prefer packComponentAvailableBaseUnits; kept for callers that show presentations. */
export function packComponentPresentations(
  product: PackAvailabilityProduct,
): number {
  const itemsPerPackage = Math.max(1, Math.floor(product.itemsPerPackage));
  const availableBase = packComponentAvailableBaseUnits(product);
  if (product.productType === "package" && itemsPerPackage > 0) {
    return Math.floor(availableBase / itemsPerPackage);
  }
  return availableBase;
}

/** Regla 22 — disponibilidad = min(floor(availableBase / needBase)) sobre componentes activos. */
export function computePackAvailableQuantity(
  components: PackAvailabilityComponent[],
): number {
  const active = components.filter(isActivePackAvailabilityComponent);
  if (active.length === 0) return 0;

  let min = Number.POSITIVE_INFINITY;
  for (const item of active) {
    const product = item.product;
    if (!product) return 0;
    const needBase = packComponentNeedBaseUnits(item, product.itemsPerPackage);
    if (needBase <= 0) return 0;
    const availableBase = packComponentAvailableBaseUnits(product);
    min = Math.min(min, Math.floor(availableBase / needBase));
  }

  return Number.isFinite(min) ? Math.max(0, min) : 0;
}

export type PackStockShortageInput = PackAvailabilityComponent & {
  productId: string;
  productName: string;
  sku: string;
};

export type PackStockShortageReason =
  "missing_product" | "inactive" | "insufficient_stock";

export type PackStockShortage = {
  productId: string;
  productName: string;
  sku: string;
  availableCombos: number;
  reason: PackStockShortageReason;
};

/**
 * Componentes que no alcanzan para armar al menos 1 combo
 * (stock insuficiente, inactivo o producto ausente).
 */
export function listPackStockShortages(
  components: PackStockShortageInput[],
): PackStockShortage[] {
  const shortages: PackStockShortage[] = [];

  for (const item of components) {
    const product = item.product;
    if (!product) {
      shortages.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        availableCombos: 0,
        reason: "missing_product",
      });
      continue;
    }

    if (!product.isActive || product.deletedAt !== null) {
      shortages.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        availableCombos: 0,
        reason: "inactive",
      });
      continue;
    }

    const needBase = packComponentNeedBaseUnits(item, product.itemsPerPackage);
    if (needBase <= 0) {
      shortages.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        availableCombos: 0,
        reason: "insufficient_stock",
      });
      continue;
    }

    const availableCombos = Math.floor(
      packComponentAvailableBaseUnits(product) / needBase,
    );
    if (availableCombos < 1) {
      shortages.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        availableCombos: Math.max(0, availableCombos),
        reason: "insufficient_stock",
      });
    }
  }

  return shortages;
}

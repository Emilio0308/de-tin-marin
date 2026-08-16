import {
  type BundleCustomizationBounds,
  type CustomizeBundleComponent,
} from "@de-tin-marin/validations/customize-bundle";
import type { OrderFormBundleComponent } from "./order-form.types";

export function canRemoveBundleComponent(
  components: CustomizeBundleComponent[],
  bounds: BundleCustomizationBounds,
): boolean {
  return components.length > bounds.minProducts;
}

export function canAddBundleComponent(
  components: CustomizeBundleComponent[],
  bounds: BundleCustomizationBounds,
): boolean {
  return components.length < bounds.maxProducts;
}

export function bundleHasProduct(
  components: CustomizeBundleComponent[],
  productId: string,
): boolean {
  return components.some((component) => component.productId === productId);
}

export function removeBundleComponent(
  components: CustomizeBundleComponent[],
  productId: string,
  bounds: BundleCustomizationBounds,
): CustomizeBundleComponent[] {
  if (!canRemoveBundleComponent(components, bounds)) return components;
  return components.filter((component) => component.productId !== productId);
}

export function addBundleComponent(
  components: CustomizeBundleComponent[],
  productId: string,
  bounds: BundleCustomizationBounds,
): CustomizeBundleComponent[] {
  if (
    !canAddBundleComponent(components, bounds) ||
    bundleHasProduct(components, productId)
  ) {
    return components;
  }

  return [...components, { productId, quantityPerUnit: 1 }];
}

export function clampBundleInitialComponents<T>(
  components: T[],
  maxProducts: number,
): T[] {
  return components.slice(0, Math.max(1, Math.floor(maxProducts)));
}

export function buildInitialBundleComponents(
  items: Array<{
    productId: string;
    unitsPerPerson: number;
    isActive?: boolean;
  }>,
  bounds: BundleCustomizationBounds,
): OrderFormBundleComponent[] {
  return clampBundleInitialComponents(
    items
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        productId: item.productId,
        quantityPerUnit: 1,
      })),
    bounds.maxProducts,
  );
}

export function buildBundleComponentLabels(
  templateItems: Array<{ productId: string; productName: string }>,
  productNamesById: Record<string, string>,
): Record<string, string> {
  const labels: Record<string, string> = {};

  for (const item of templateItems) {
    labels[item.productId] = item.productName;
  }

  for (const [productId, name] of Object.entries(productNamesById)) {
    labels[productId] = name;
  }

  return labels;
}

import {
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
  type CustomizeBundleComponent,
} from "@de-tin-marin/validations/customize-bundle";
import type { OrderFormBundleComponent } from "./order-form.types";

export { BUNDLE_CUSTOMIZATION_MAX, BUNDLE_CUSTOMIZATION_MIN };

export function canRemoveBundleComponent(
  components: CustomizeBundleComponent[],
): boolean {
  return components.length > BUNDLE_CUSTOMIZATION_MIN;
}

export function canAddBundleComponent(
  components: CustomizeBundleComponent[],
): boolean {
  return components.length < BUNDLE_CUSTOMIZATION_MAX;
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
): CustomizeBundleComponent[] {
  if (!canRemoveBundleComponent(components)) return components;
  return components.filter((component) => component.productId !== productId);
}

export function addBundleComponent(
  components: CustomizeBundleComponent[],
  productId: string,
): CustomizeBundleComponent[] {
  if (
    !canAddBundleComponent(components) ||
    bundleHasProduct(components, productId)
  ) {
    return components;
  }

  return [...components, { productId, quantityPerUnit: 1 }];
}

export function clampBundleInitialComponents<T>(components: T[]): T[] {
  return components.slice(0, BUNDLE_CUSTOMIZATION_MAX);
}

export function buildInitialBundleComponents(
  items: Array<{
    productId: string;
    unitsPerPerson: number;
    isActive?: boolean;
  }>,
): OrderFormBundleComponent[] {
  return clampBundleInitialComponents(
    items
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        productId: item.productId,
        quantityPerUnit: 1,
      })),
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

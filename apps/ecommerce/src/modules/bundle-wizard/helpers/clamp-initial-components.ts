import type { BundleCustomizationBounds } from "@de-tin-marin/validations/customize-bundle";

export function clampBundleInitialComponents<T>(
  components: T[],
  maxProducts: number,
): T[] {
  const max = Math.max(1, Math.floor(maxProducts));
  return components.slice(0, max);
}

export function clampBundleInitialComponentsWithBounds<T>(
  components: T[],
  bounds: BundleCustomizationBounds,
): T[] {
  return clampBundleInitialComponents(components, bounds.maxProducts);
}

import { BUNDLE_CUSTOMIZATION_MAX } from "@de-tin-marin/validations/customize-bundle";

export function clampBundleInitialComponents<T>(components: T[]): T[] {
  return components.slice(0, BUNDLE_CUSTOMIZATION_MAX);
}

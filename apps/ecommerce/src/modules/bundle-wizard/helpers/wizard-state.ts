import {
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
  type CustomizeBundleComponent,
} from "@de-tin-marin/validations/customize-bundle";
import { storeFeatures } from "@de-tin-marin/config/store-features";

export function canRemoveComponent(
  components: CustomizeBundleComponent[],
): boolean {
  return components.length > BUNDLE_CUSTOMIZATION_MIN;
}

export function canAddComponent(
  components: CustomizeBundleComponent[],
): boolean {
  return components.length < BUNDLE_CUSTOMIZATION_MAX;
}

export function hasProduct(
  components: CustomizeBundleComponent[],
  productId: string,
): boolean {
  return components.some((component) => component.productId === productId);
}

export function removeComponent(
  components: CustomizeBundleComponent[],
  productId: string,
): CustomizeBundleComponent[] {
  if (!canRemoveComponent(components)) return components;
  return components.filter((component) => component.productId !== productId);
}

export function addComponent(
  components: CustomizeBundleComponent[],
  productId: string,
  unitsPerPerson = 1,
): CustomizeBundleComponent[] {
  if (!canAddComponent(components) || hasProduct(components, productId)) {
    return components;
  }

  return [
    ...components,
    {
      productId,
      quantityPerUnit: storeFeatures.enableUnitsPerPerson ? unitsPerPerson : 1,
    },
  ];
}

export function buildComponentLabels(
  templateItems: Array<{ productId: string; productName: string }>,
  pickerLabels: Record<string, string>,
): Record<string, string> {
  const labels: Record<string, string> = {};

  for (const item of templateItems) {
    labels[item.productId] = item.productName;
  }

  for (const [productId, name] of Object.entries(pickerLabels)) {
    labels[productId] = name;
  }

  return labels;
}

export function buildComponentImages(
  templateItems: Array<{ productId: string; imageUrl: string }>,
  pickerImages: Record<string, string>,
): Record<string, string> {
  const images: Record<string, string> = {};

  for (const item of templateItems) {
    images[item.productId] = item.imageUrl;
  }

  for (const [productId, imageUrl] of Object.entries(pickerImages)) {
    images[productId] = imageUrl;
  }

  return images;
}

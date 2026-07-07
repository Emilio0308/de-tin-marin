import { describe, expect, it } from "vitest";
import {
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
  customizeBundleInputSchema,
  validateBundleCustomization,
} from "./customize-bundle";

const bundleId = "11111111-1111-4111-8111-111111111111";

function productId(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function buildComponents(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    productId: productId(index + 1),
    quantityPerUnit: 1,
  }));
}

describe("customizeBundleInputSchema", () => {
  it("rechaza menos de 5 componentes", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      components: buildComponents(BUNDLE_CUSTOMIZATION_MIN - 1),
    });

    expect(result.success).toBe(false);
  });

  it("rechaza más de 20 componentes", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      components: buildComponents(BUNDLE_CUSTOMIZATION_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rechaza productos duplicados", () => {
    const duplicateId = productId(1);
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      components: [
        { productId: duplicateId, quantityPerUnit: 1 },
        { productId: duplicateId, quantityPerUnit: 1 },
        { productId: productId(2), quantityPerUnit: 1 },
        { productId: productId(3), quantityPerUnit: 1 },
        { productId: productId(4), quantityPerUnit: 1 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("acepta composición válida", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      components: buildComponents(BUNDLE_CUSTOMIZATION_MIN),
    });

    expect(result.success).toBe(true);
  });
});

describe("validateBundleCustomization", () => {
  it("devuelve MIN_COMPONENTS cuando hay pocos dulces", () => {
    const result = validateBundleCustomization(buildComponents(3));
    expect(result).toEqual({ ok: false, error: "MIN_COMPONENTS" });
  });

  it("devuelve MAX_COMPONENTS cuando hay demasiados dulces", () => {
    const result = validateBundleCustomization(buildComponents(21));
    expect(result).toEqual({ ok: false, error: "MAX_COMPONENTS" });
  });

  it("devuelve DUPLICATE_PRODUCT con ids repetidos", () => {
    const duplicateId = productId(1);
    const result = validateBundleCustomization([
      { productId: duplicateId, quantityPerUnit: 1 },
      { productId: duplicateId, quantityPerUnit: 1 },
      { productId: productId(2), quantityPerUnit: 1 },
      { productId: productId(3), quantityPerUnit: 1 },
      { productId: productId(4), quantityPerUnit: 1 },
    ]);

    expect(result).toEqual({ ok: false, error: "DUPLICATE_PRODUCT" });
  });

  it("acepta composición válida", () => {
    const components = buildComponents(6);
    const result = validateBundleCustomization(components);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(6);
    }
  });
});

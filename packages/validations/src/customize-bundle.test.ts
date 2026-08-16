import { describe, expect, it } from "vitest";
import {
  BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
  BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
  customizeBundleInputSchema,
  resolveBundleCustomizationBounds,
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
  it("acepta composición estructural mínima (1+) sin bounds de plantilla", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      components: buildComponents(1),
    });

    expect(result.success).toBe(true);
  });

  it("rechaza productos duplicados", () => {
    const duplicateId = productId(1);
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      components: [
        { productId: duplicateId, quantityPerUnit: 1 },
        { productId: duplicateId, quantityPerUnit: 1 },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("resolveBundleCustomizationBounds", () => {
  it("usa defaults 8/20 cuando faltan valores", () => {
    expect(resolveBundleCustomizationBounds({})).toEqual({
      minProducts: BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
      maxProducts: BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
    });
  });

  it("normaliza max < min elevando max", () => {
    expect(
      resolveBundleCustomizationBounds({
        customizationMinProducts: 10,
        customizationMaxProducts: 4,
      }),
    ).toEqual({ minProducts: 10, maxProducts: 10 });
  });
});

describe("validateBundleCustomization", () => {
  it("devuelve MIN_COMPONENTS cuando hay pocos dulces para los bounds", () => {
    const result = validateBundleCustomization(buildComponents(3), {
      minProducts: 5,
      maxProducts: 12,
    });
    expect(result).toEqual({ ok: false, error: "MIN_COMPONENTS" });
  });

  it("devuelve MAX_COMPONENTS cuando hay demasiados dulces para los bounds", () => {
    const result = validateBundleCustomization(buildComponents(13), {
      minProducts: 5,
      maxProducts: 12,
    });
    expect(result).toEqual({ ok: false, error: "MAX_COMPONENTS" });
  });

  it("devuelve DUPLICATE_PRODUCT con ids repetidos", () => {
    const duplicateId = productId(1);
    const result = validateBundleCustomization(
      [
        { productId: duplicateId, quantityPerUnit: 1 },
        { productId: duplicateId, quantityPerUnit: 1 },
        { productId: productId(2), quantityPerUnit: 1 },
        { productId: productId(3), quantityPerUnit: 1 },
        { productId: productId(4), quantityPerUnit: 1 },
      ],
      { minProducts: 5, maxProducts: 12 },
    );

    expect(result).toEqual({ ok: false, error: "DUPLICATE_PRODUCT" });
  });

  it("acepta composición válida para bounds distintos al default", () => {
    const components = buildComponents(6);
    const result = validateBundleCustomization(components, {
      minProducts: 6,
      maxProducts: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(6);
    }
  });

  it("usa defaults 8/20 cuando no se pasan bounds", () => {
    expect(
      validateBundleCustomization(
        buildComponents(BUNDLE_CUSTOMIZATION_DEFAULT_MIN - 1),
      ),
    ).toEqual({ ok: false, error: "MIN_COMPONENTS" });

    expect(
      validateBundleCustomization(
        buildComponents(BUNDLE_CUSTOMIZATION_DEFAULT_MAX + 1),
      ),
    ).toEqual({ ok: false, error: "MAX_COMPONENTS" });

    expect(
      validateBundleCustomization(
        buildComponents(BUNDLE_CUSTOMIZATION_DEFAULT_MIN),
      ).ok,
    ).toBe(true);
  });
});

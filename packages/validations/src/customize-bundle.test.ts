import { describe, expect, it } from "vitest";
import {
  BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
  BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
  BUNDLE_LINE_QUANTITY_MAX,
  BUNDLE_LINE_QUANTITY_MIN,
  clampBundleLineQuantity,
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
  it("acepta composición estructural mínima (1+) con quantity en rango", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      quantity: BUNDLE_LINE_QUANTITY_MIN,
      components: buildComponents(1),
    });

    expect(result.success).toBe(true);
  });

  it("acepta quantity en el máximo (100)", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      quantity: BUNDLE_LINE_QUANTITY_MAX,
      components: buildComponents(1),
    });

    expect(result.success).toBe(true);
  });

  it("rechaza quantity por debajo del mínimo (15)", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      quantity: BUNDLE_LINE_QUANTITY_MIN - 1,
      components: buildComponents(1),
    });

    expect(result.success).toBe(false);
  });

  it("rechaza quantity por encima del máximo (100)", () => {
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      quantity: BUNDLE_LINE_QUANTITY_MAX + 1,
      components: buildComponents(1),
    });

    expect(result.success).toBe(false);
  });

  it("rechaza quantity 0 y no-enteros", () => {
    expect(
      customizeBundleInputSchema.safeParse({
        bundleId,
        quantity: 0,
        components: buildComponents(1),
      }).success,
    ).toBe(false);

    expect(
      customizeBundleInputSchema.safeParse({
        bundleId,
        quantity: 15.5,
        components: buildComponents(1),
      }).success,
    ).toBe(false);
  });

  it("rechaza productos duplicados", () => {
    const duplicateId = productId(1);
    const result = customizeBundleInputSchema.safeParse({
      bundleId,
      quantity: BUNDLE_LINE_QUANTITY_MIN,
      components: [
        { productId: duplicateId, quantityPerUnit: 1 },
        { productId: duplicateId, quantityPerUnit: 1 },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("clampBundleLineQuantity", () => {
  it("acota al rango 15–100", () => {
    expect(clampBundleLineQuantity(10)).toBe(BUNDLE_LINE_QUANTITY_MIN);
    expect(clampBundleLineQuantity(50)).toBe(50);
    expect(clampBundleLineQuantity(200)).toBe(BUNDLE_LINE_QUANTITY_MAX);
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

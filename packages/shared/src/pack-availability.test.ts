import { describe, expect, it } from "vitest";
import {
  computePackAvailableQuantity,
  packComponentPresentations,
  type PackAvailabilityComponent,
  type PackAvailabilityProduct,
} from "./pack-availability";

function product(
  overrides: Partial<PackAvailabilityProduct> = {},
): PackAvailabilityProduct {
  return {
    isActive: true,
    deletedAt: null,
    productType: "unit",
    itemsPerPackage: 1,
    stockSealedPackages: 0,
    stockLooseBaseUnits: 10,
    ...overrides,
  };
}

function component(
  packageQuantity: number,
  productOverrides?: Partial<PackAvailabilityProduct> | null,
): PackAvailabilityComponent {
  return {
    packageQuantity,
    product:
      productOverrides === null ? null : product(productOverrides ?? undefined),
  };
}

describe("packComponentPresentations", () => {
  it("usa solo loose para product_type unit", () => {
    expect(
      packComponentPresentations(
        product({
          productType: "unit",
          stockSealedPackages: 50,
          stockLooseBaseUnits: 7,
        }),
      ),
    ).toBe(7);
  });

  it("convierte sealed+loose a presentaciones para package", () => {
    expect(
      packComponentPresentations(
        product({
          productType: "package",
          itemsPerPackage: 10,
          stockSealedPackages: 2,
          stockLooseBaseUnits: 5,
        }),
      ),
    ).toBe(2);
  });
});

describe("computePackAvailableQuantity", () => {
  it("devuelve 0 si no hay componentes activos", () => {
    expect(computePackAvailableQuantity([])).toBe(0);
    expect(
      computePackAvailableQuantity([
        component(1, { isActive: false, stockLooseBaseUnits: 100 }),
      ]),
    ).toBe(0);
  });

  it("toma el mínimo (bottleneck) entre componentes", () => {
    expect(
      computePackAvailableQuantity([
        component(2, { stockLooseBaseUnits: 10 }),
        component(1, { stockLooseBaseUnits: 3 }),
      ]),
    ).toBe(3);
  });

  it("ignora productos inactivos o soft-deleted al calcular", () => {
    expect(
      computePackAvailableQuantity([
        component(1, { stockLooseBaseUnits: 5 }),
        component(1, { isActive: false, stockLooseBaseUnits: 1 }),
        component(1, {
          deletedAt: "2026-01-01T00:00:00Z",
          stockLooseBaseUnits: 1,
        }),
      ]),
    ).toBe(5);
  });

  it("devuelve 0 si un componente activo no tiene producto", () => {
    expect(computePackAvailableQuantity([component(1, null)])).toBe(0);
  });
});

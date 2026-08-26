import { describe, expect, it } from "vitest";
import {
  computePackAvailableQuantity,
  listPackStockShortages,
  packComponentAvailableBaseUnits,
  packComponentNeedBaseUnits,
  packComponentPresentations,
  type PackAvailabilityComponent,
  type PackAvailabilityProduct,
  type PackStockShortageInput,
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
  unitQuantity = 0,
): PackAvailabilityComponent {
  return {
    packageQuantity,
    unitQuantity,
    product:
      productOverrides === null ? null : product(productOverrides ?? undefined),
  };
}

describe("packComponentAvailableBaseUnits", () => {
  it("usa solo loose para product_type unit", () => {
    expect(
      packComponentAvailableBaseUnits(
        product({
          productType: "unit",
          stockSealedPackages: 50,
          stockLooseBaseUnits: 7,
        }),
      ),
    ).toBe(7);
  });

  it("suma sealed×ipp + loose para package", () => {
    expect(
      packComponentAvailableBaseUnits(
        product({
          productType: "package",
          itemsPerPackage: 10,
          stockSealedPackages: 2,
          stockLooseBaseUnits: 5,
        }),
      ),
    ).toBe(25);
  });
});

describe("packComponentNeedBaseUnits", () => {
  it("combina packageQuantity×ipp + unitQuantity", () => {
    expect(
      packComponentNeedBaseUnits({ packageQuantity: 3, unitQuantity: 5 }, 10),
    ).toBe(35);
  });
});

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

  it("cuenta dual qty en unidades base (3 tiras + 5 u. con ipp 10)", () => {
    // available 50 base; need 35 → floor(50/35)=1
    expect(
      computePackAvailableQuantity([
        component(
          3,
          {
            productType: "package",
            itemsPerPackage: 10,
            stockSealedPackages: 5,
            stockLooseBaseUnits: 0,
          },
          5,
        ),
      ]),
    ).toBe(1);
  });

  it("permite solo unitQuantity", () => {
    expect(
      computePackAvailableQuantity([
        component(
          0,
          {
            productType: "package",
            itemsPerPackage: 10,
            stockSealedPackages: 2,
            stockLooseBaseUnits: 0,
          },
          7,
        ),
      ]),
    ).toBe(2); // floor(20/7)=2
  });
});

describe("listPackStockShortages", () => {
  function labeled(
    productId: string,
    packageQuantity: number,
    productOverrides?: Partial<PackAvailabilityProduct> | null,
    unitQuantity = 0,
  ): PackStockShortageInput {
    return {
      productId,
      productName: `Name ${productId}`,
      sku: `SKU-${productId}`,
      ...component(packageQuantity, productOverrides, unitQuantity),
    };
  }

  it("lista componentes activos sin stock para 1 combo", () => {
    expect(
      listPackStockShortages([
        labeled("a", 1, { stockLooseBaseUnits: 5 }),
        labeled("b", 2, { stockLooseBaseUnits: 1 }),
      ]),
    ).toEqual([
      {
        productId: "b",
        productName: "Name b",
        sku: "SKU-b",
        availableCombos: 0,
        reason: "insufficient_stock",
      },
    ]);
  });

  it("incluye producto ausente o inactivo", () => {
    expect(
      listPackStockShortages([
        labeled("missing", 1, null),
        labeled("off", 1, { isActive: false, stockLooseBaseUnits: 100 }),
      ]),
    ).toEqual([
      {
        productId: "missing",
        productName: "Name missing",
        sku: "SKU-missing",
        availableCombos: 0,
        reason: "missing_product",
      },
      {
        productId: "off",
        productName: "Name off",
        sku: "SKU-off",
        availableCombos: 0,
        reason: "inactive",
      },
    ]);
  });

  it("devuelve vacío si todos alcanzan para al menos 1 combo", () => {
    expect(
      listPackStockShortages([
        labeled("a", 1, { stockLooseBaseUnits: 5 }),
        labeled("b", 1, { stockLooseBaseUnits: 2 }),
      ]),
    ).toEqual([]);
  });
});

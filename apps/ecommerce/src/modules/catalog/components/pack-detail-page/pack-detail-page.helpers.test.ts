import { describe, expect, it } from "vitest";
import { formatPackComponentQuantity } from "./pack-detail-page.helpers";

const labels = {
  packagesOfUnits: ({ packages, units }: { packages: number; units: number }) =>
    `${packages} paquetes de ${units} unidades`,
  unitsOnly: ({ count }: { count: number }) => `${count} unidades`,
  packagesAndLoose: ({
    packages,
    unitsPerPackage,
    loose,
  }: {
    packages: number;
    unitsPerPackage: number;
    loose: number;
  }) =>
    `${packages} paquetes de ${unitsPerPackage} unidades + ${loose} sueltas`,
};

describe("formatPackComponentQuantity", () => {
  it("describe paquetes de N unidades para productos package", () => {
    expect(
      formatPackComponentQuantity(
        {
          packageQuantity: 2,
          unitQuantity: 0,
          itemsPerPackage: 12,
          productType: "package",
        },
        labels,
      ),
    ).toBe("2 paquetes de 12 unidades");
  });

  it("usa unidades sueltas para productos unit", () => {
    expect(
      formatPackComponentQuantity(
        {
          packageQuantity: 3,
          unitQuantity: 0,
          itemsPerPackage: 1,
          productType: "unit",
        },
        labels,
      ),
    ).toBe("3 unidades");
  });

  it("combina paquetes y unidades sueltas", () => {
    expect(
      formatPackComponentQuantity(
        {
          packageQuantity: 3,
          unitQuantity: 5,
          itemsPerPackage: 10,
          productType: "package",
        },
        labels,
      ),
    ).toBe("3 paquetes de 10 unidades + 5 sueltas");
  });

  it("solo unitQuantity", () => {
    expect(
      formatPackComponentQuantity(
        {
          packageQuantity: 0,
          unitQuantity: 7,
          itemsPerPackage: 10,
          productType: "package",
        },
        labels,
      ),
    ).toBe("7 unidades");
  });
});

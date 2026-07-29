import { describe, expect, it } from "vitest";
import { formatPackComponentQuantity } from "./pack-detail-page.helpers";

const labels = {
  packagesOfUnits: ({ packages, units }: { packages: number; units: number }) =>
    `${packages} paquetes de ${units} unidades`,
  unitsOnly: ({ count }: { count: number }) => `${count} unidades`,
};

describe("formatPackComponentQuantity", () => {
  it("describe paquetes de N unidades para productos package", () => {
    expect(
      formatPackComponentQuantity(
        {
          packageQuantity: 2,
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
          itemsPerPackage: 1,
          productType: "unit",
        },
        labels,
      ),
    ).toBe("3 unidades");
  });
});

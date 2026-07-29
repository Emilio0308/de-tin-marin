import { describe, expect, it } from "vitest";
import { computePackReference } from "./pack-price";

describe("computePackReference", () => {
  it("suma precios de paquete × cantidades", () => {
    expect(
      computePackReference([
        { packageNetPrice: 6.5, packageQuantity: 1 },
        { packageNetPrice: 4, packageQuantity: 1 },
      ]),
    ).toEqual({ referenceNetPrice: 10.5 });
  });

  it("multiplica packageQuantity", () => {
    expect(
      computePackReference([
        { packageNetPrice: 5, packageQuantity: 2 },
        { packageNetPrice: 3, packageQuantity: 2 },
      ]),
    ).toEqual({ referenceNetPrice: 16 });
  });
});

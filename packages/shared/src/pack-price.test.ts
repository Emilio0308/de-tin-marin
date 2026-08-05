import { describe, expect, it } from "vitest";
import { computePackReference } from "./pack-price";

describe("computePackReference", () => {
  it("suma precios de paquete × cantidades", () => {
    expect(
      computePackReference([
        {
          packageNetPrice: 6.5,
          unitNetPrice: 6.5,
          packageQuantity: 1,
          unitQuantity: 0,
        },
        {
          packageNetPrice: 4,
          unitNetPrice: 4,
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ]),
    ).toEqual({ referenceNetPrice: 10.5 });
  });

  it("multiplica packageQuantity", () => {
    expect(
      computePackReference([
        {
          packageNetPrice: 5,
          unitNetPrice: 0.5,
          packageQuantity: 2,
          unitQuantity: 0,
        },
        {
          packageNetPrice: 3,
          unitNetPrice: 0.3,
          packageQuantity: 2,
          unitQuantity: 0,
        },
      ]),
    ).toEqual({ referenceNetPrice: 16 });
  });

  it("suma normal×package + unit×unitQuantity", () => {
    expect(
      computePackReference([
        {
          packageNetPrice: 10,
          unitNetPrice: 1,
          packageQuantity: 3,
          unitQuantity: 5,
        },
      ]),
    ).toEqual({ referenceNetPrice: 35 });
  });

  it("acepta solo unidades sueltas", () => {
    expect(
      computePackReference([
        {
          packageNetPrice: 10,
          unitNetPrice: 1,
          packageQuantity: 0,
          unitQuantity: 7,
        },
      ]),
    ).toEqual({ referenceNetPrice: 7 });
  });
});

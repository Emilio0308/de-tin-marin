import { describe, expect, it } from "vitest";
import { computeProductMargin } from "./product-margin";

describe("computeProductMargin", () => {
  it("devuelve nulls si costo es null o 0", () => {
    expect(
      computeProductMargin({ saleNetPrice: 15, costNetPrice: null }),
    ).toEqual({ margin: null, marginPct: null });
    expect(computeProductMargin({ saleNetPrice: 15, costNetPrice: 0 })).toEqual(
      { margin: null, marginPct: null },
    );
  });

  it("calcula margen y % = margen / costo", () => {
    expect(
      computeProductMargin({ saleNetPrice: 15, costNetPrice: 10 }),
    ).toEqual({ margin: 5, marginPct: 0.5 });
  });

  it("permite margen negativo", () => {
    expect(computeProductMargin({ saleNetPrice: 8, costNetPrice: 10 })).toEqual(
      { margin: -2, marginPct: -0.2 },
    );
  });
});

import { describe, expect, it } from "vitest";
import { orderCartAnchorName } from "./order-cart-anchor";

describe("orderCartAnchorName", () => {
  it("sanitiza order_number para defined name de Excel", () => {
    expect(orderCartAnchorName("TM-20260730-0001")).toBe(
      "Orden_TM_20260730_0001",
    );
  });
});

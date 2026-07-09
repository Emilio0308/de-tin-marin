import { describe, expect, it } from "vitest";
import { formatPrice } from "./product-card.helpers";

describe("product-card.helpers", () => {
  it("formatPrice añade símbolo y dos decimales", () => {
    expect(formatPrice(5.5)).toBe("S/5.50");
    expect(formatPrice(12)).toBe("S/12.00");
    expect(formatPrice(8.9)).toBe("S/8.90");
  });
});

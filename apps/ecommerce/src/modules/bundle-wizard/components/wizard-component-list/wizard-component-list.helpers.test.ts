import { describe, expect, it } from "vitest";
import { resolveComponentTotalQuantity } from "./wizard-component-list.helpers";

describe("resolveComponentTotalQuantity", () => {
  it("multiplica unidades por persona por número de sorpresas", () => {
    expect(resolveComponentTotalQuantity(2, 10)).toBe(20);
  });
});

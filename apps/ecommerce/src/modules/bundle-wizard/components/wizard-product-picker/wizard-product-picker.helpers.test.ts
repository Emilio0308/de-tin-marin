import { describe, expect, it } from "vitest";
import {
  flattenProductPickerPages,
  getNextProductPickerPage,
} from "./wizard-product-picker.helpers";

describe("wizard-product-picker.helpers", () => {
  it("aplana páginas del picker", () => {
    expect(
      flattenProductPickerPages([
        { items: [{ id: "a" } as never], page: 1, pageSize: 10, total: 15 },
        { items: [{ id: "b" } as never], page: 2, pageSize: 10, total: 15 },
      ]),
    ).toHaveLength(2);
  });

  it("calcula la siguiente página cuando hay más resultados", () => {
    expect(
      getNextProductPickerPage({ items: [], page: 1, pageSize: 10, total: 25 }),
    ).toBe(2);
    expect(
      getNextProductPickerPage({ items: [], page: 3, pageSize: 10, total: 25 }),
    ).toBeUndefined();
  });
});

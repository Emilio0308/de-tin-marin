import { describe, expect, it } from "vitest";
import {
  defaultSelectedSections,
  hasSelectedSection,
  selectedSectionsList,
} from "./catalog-export-panel.helpers";

describe("catalog-export-panel.helpers", () => {
  it("defaultSelectedSections marca todas", () => {
    expect(selectedSectionsList(defaultSelectedSections())).toEqual([
      "products",
      "bundles",
      "packs",
      "containers",
      "orders",
    ]);
  });

  it("hasSelectedSection detecta vacío", () => {
    expect(
      hasSelectedSection({
        products: false,
        bundles: false,
        packs: false,
        containers: false,
        orders: false,
      }),
    ).toBe(false);
  });
});

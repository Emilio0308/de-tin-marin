import { describe, expect, it } from "vitest";
import { clampBundleInitialComponents } from "./clamp-initial-components";

describe("clampBundleInitialComponents", () => {
  it("mantiene componentes dentro del máximo indicado", () => {
    const maxProducts = 6;
    const components = Array.from({ length: maxProducts + 5 }, (_, index) => ({
      productId: `p-${index}`,
    }));

    const result = clampBundleInitialComponents(components, maxProducts);

    expect(result).toHaveLength(maxProducts);
    expect(result[0]).toEqual({ productId: "p-0" });
    expect(result.at(-1)).toEqual({
      productId: `p-${maxProducts - 1}`,
    });
  });
});

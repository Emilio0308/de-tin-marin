import { describe, expect, it } from "vitest";
import { BUNDLE_CUSTOMIZATION_MAX } from "@de-tin-marin/validations/customize-bundle";
import { clampBundleInitialComponents } from "./clamp-initial-components";

describe("clampBundleInitialComponents", () => {
  it("mantiene componentes dentro del máximo permitido", () => {
    const components = Array.from(
      { length: BUNDLE_CUSTOMIZATION_MAX + 5 },
      (_, index) => ({ productId: `p-${index}` }),
    );

    const result = clampBundleInitialComponents(components);

    expect(result).toHaveLength(BUNDLE_CUSTOMIZATION_MAX);
    expect(result[0]).toEqual({ productId: "p-0" });
    expect(result.at(-1)).toEqual({
      productId: `p-${BUNDLE_CUSTOMIZATION_MAX - 1}`,
    });
  });
});

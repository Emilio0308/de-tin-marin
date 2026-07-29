import { describe, expect, it } from "vitest";
import { buildComponentImages, buildComponentLabels } from "./wizard-state";

describe("wizard-state helpers", () => {
  it("combina imágenes del template y del picker", () => {
    expect(
      buildComponentImages(
        [
          {
            productId: "p1",
            imageUrl: "https://example.com/template.png",
          },
        ],
        { p2: "https://example.com/picker.png" },
      ),
    ).toEqual({
      p1: "https://example.com/template.png",
      p2: "https://example.com/picker.png",
    });
  });

  it("combina nombres del template y del picker", () => {
    expect(
      buildComponentLabels([{ productId: "p1", productName: "Gomitas" }], {
        p2: "Chocolate",
      }),
    ).toEqual({
      p1: "Gomitas",
      p2: "Chocolate",
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  addComponent,
  buildComponentImages,
  buildComponentLabels,
  setComponentQuantityPerUnit,
} from "./wizard-state";

vi.mock("@de-tin-marin/config/store-features", () => ({
  storeFeatures: {
    enableUnitsPerPerson: true,
    pickupEnabled: false,
    strictStockValidationOnCheckout: true,
  },
}));

const bounds = { minProducts: 1, maxProducts: 20 };

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

  it("agrega componente con unitsPerPerson de la plantilla", () => {
    expect(addComponent([], "p1", bounds, 3)).toEqual([
      { productId: "p1", quantityPerUnit: 3 },
    ]);
  });

  it("actualiza quantityPerUnit con mínimo 1", () => {
    const components = [
      { productId: "p1", quantityPerUnit: 2 },
      { productId: "p2", quantityPerUnit: 1 },
    ];

    expect(setComponentQuantityPerUnit(components, "p1", 4)).toEqual([
      { productId: "p1", quantityPerUnit: 4 },
      { productId: "p2", quantityPerUnit: 1 },
    ]);
    expect(setComponentQuantityPerUnit(components, "p1", 0)).toEqual([
      { productId: "p1", quantityPerUnit: 1 },
      { productId: "p2", quantityPerUnit: 1 },
    ]);
  });
});

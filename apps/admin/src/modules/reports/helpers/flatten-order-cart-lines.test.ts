import { describe, expect, it } from "vitest";
import { flattenOrderCartLines } from "./flatten-order-cart-lines";

const productId = "11111111-1111-1111-1111-111111111111";
const packId = "22222222-2222-2222-2222-222222222222";
const bundleId = "33333333-3333-3333-3333-333333333333";
const containerId = "44444444-4444-4444-4444-444444444444";

describe("flattenOrderCartLines", () => {
  it("aplana product, pack con componentes y bundle con envase", () => {
    const rows = flattenOrderCartLines({
      lines: [
        {
          type: "product",
          productId,
          sku: "P1",
          name: "Gomitas",
          quantity: 2,
          unitPrice: 5,
          lineTotal: 10,
        },
        {
          type: "pack",
          packId,
          sku: "PACK-1",
          name: "Combo",
          quantity: 1,
          unitPrice: 20,
          lineTotal: 20,
          components: [
            {
              productId,
              productName: "Gomitas",
              sku: "P1",
              packageQuantity: 2,
              totalPackages: 2,
            },
          ],
        },
        {
          type: "bundle",
          bundleId,
          name: "Sorpresa",
          quantity: 3,
          lineTotal: 30,
          container: {
            containerId,
            sku: "ENV-1",
            name: "Caja",
            unitPrice: 2,
          },
          components: [
            {
              productId,
              productName: "Gomitas",
              sku: "P1",
              quantityPerUnit: 1,
              totalQuantity: 3,
              unitPrice: 5,
            },
          ],
        },
      ],
    });

    expect(rows.filter((row) => row.level === "line")).toHaveLength(3);
    expect(rows.filter((row) => row.level === "component")).toHaveLength(2);
    expect(rows.filter((row) => row.level === "container")).toHaveLength(1);
    expect(rows.some((row) => row.lineType === "pack")).toBe(true);
    expect(rows.some((row) => row.detail === "Envase")).toBe(true);
  });

  it("devuelve vacío si no hay lines", () => {
    expect(flattenOrderCartLines(null)).toEqual([]);
    expect(flattenOrderCartLines({})).toEqual([]);
  });
});

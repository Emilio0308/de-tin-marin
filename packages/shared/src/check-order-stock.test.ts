import { describe, expect, it } from "vitest";
import type { OrderShoppingCart } from "./order-cart";
import {
  aggregateStockDemands,
  checkOrderStock,
  type StockInventoryContainer,
  type StockInventoryProduct,
} from "./check-order-stock";

const productId = "11111111-1111-1111-1111-111111111111";
const containerId = "22222222-2222-2222-2222-222222222222";

function productCart(quantity: number): OrderShoppingCart {
  return {
    lines: [
      {
        type: "product",
        productId,
        sku: "LAYS-10",
        name: "Lay's",
        quantity,
        unitPrice: 1,
        lineTotal: quantity,
      },
    ],
  };
}

describe("aggregateStockDemands", () => {
  it("sums bundle components and container needs", () => {
    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "bundle",
          bundleId: "33333333-3333-3333-3333-333333333333",
          name: "Sorpresa",
          quantity: 2,
          lineTotal: 20,
          container: {
            containerId,
            sku: "CAJA-M",
            name: "Caja mediana",
            unitPrice: 3,
          },
          components: [
            {
              productId,
              productName: "Lay's",
              sku: "LAYS-10",
              quantityPerUnit: 1,
              totalQuantity: 2,
              unitPrice: 1,
            },
          ],
        },
      ],
    };

    const { products, containers } = aggregateStockDemands(cart);
    expect(products.get(productId)).toEqual({
      need: 2,
      sku: "LAYS-10",
      name: "Lay's",
    });
    expect(containers.get(containerId)).toEqual({
      need: 2,
      sku: "CAJA-M",
      name: "Caja mediana",
    });
  });

  it("skips container for legacy serviceFee bundles", () => {
    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "bundle",
          bundleId: "33333333-3333-3333-3333-333333333333",
          name: "Legacy",
          quantity: 1,
          serviceFee: 5,
          lineTotal: 10,
          components: [
            {
              productId,
              productName: "Lay's",
              sku: "LAYS-10",
              quantityPerUnit: 1,
              totalQuantity: 1,
              unitPrice: 1,
            },
          ],
        },
      ],
    };

    const { containers } = aggregateStockDemands(cart);
    expect(containers.size).toBe(0);
  });
});

describe("checkOrderStock", () => {
  const laysProduct: StockInventoryProduct = {
    id: productId,
    sku: "LAYS-10",
    name: "Lay's",
    stockSealedPackages: 5,
    stockLooseBaseUnits: 0,
    itemsPerPackage: 10,
  };

  it("passes when loose stock covers product line", () => {
    const products = new Map<string, StockInventoryProduct>([
      [
        productId,
        {
          ...laysProduct,
          stockSealedPackages: 0,
          stockLooseBaseUnits: 30,
        },
      ],
    ]);

    const result = checkOrderStock(productCart(25), products, new Map());
    expect(result).toEqual({ ok: true });
  });

  it("passes for Lay's 25 of 50 sealed packages", () => {
    const products = new Map<string, StockInventoryProduct>([
      [productId, laysProduct],
    ]);

    const result = checkOrderStock(productCart(25), products, new Map());
    expect(result).toEqual({ ok: true });
  });

  it("reports product shortage", () => {
    const products = new Map<string, StockInventoryProduct>([
      [
        productId,
        { ...laysProduct, stockSealedPackages: 1, stockLooseBaseUnits: 0 },
      ],
    ]);

    const result = checkOrderStock(productCart(15), products, new Map());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.shortages[0]).toMatchObject({
      kind: "product",
      sku: "LAYS-10",
      required: 15,
      available: 10,
    });
  });

  it("reports container shortage for bundle lines", () => {
    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "bundle",
          bundleId: "33333333-3333-3333-3333-333333333333",
          name: "Sorpresa",
          quantity: 3,
          lineTotal: 30,
          container: {
            containerId,
            sku: "CAJA-M",
            name: "Caja mediana",
            unitPrice: 3,
          },
          components: [
            {
              productId,
              productName: "Lay's",
              sku: "LAYS-10",
              quantityPerUnit: 1,
              totalQuantity: 3,
              unitPrice: 1,
            },
          ],
        },
      ],
    };

    const products = new Map<string, StockInventoryProduct>([
      [productId, laysProduct],
    ]);
    const containers = new Map<string, StockInventoryContainer>([
      [
        containerId,
        {
          id: containerId,
          sku: "CAJA-M",
          name: "Caja mediana",
          stockQuantity: 2,
        },
      ],
    ]);

    const result = checkOrderStock(cart, products, containers);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.shortages).toEqual([
      {
        kind: "container",
        id: containerId,
        sku: "CAJA-M",
        name: "Caja mediana",
        required: 3,
        available: 2,
      },
    ]);
  });
});

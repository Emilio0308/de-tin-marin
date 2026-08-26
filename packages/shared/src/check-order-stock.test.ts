import { describe, expect, it } from "vitest";
import type { OrderShoppingCart } from "./order-cart";
import {
  aggregateStockDemands,
  checkOrderStock,
  resolveProductBaseUnitsNeed,
  type StockInventoryContainer,
  type StockInventoryProduct,
} from "./check-order-stock";

const productId = "11111111-1111-1111-1111-111111111111";
const containerId = "22222222-2222-2222-2222-222222222222";

function productCart(
  packageQuantity: number,
  unitQuantity = 0,
): OrderShoppingCart {
  return {
    lines: [
      {
        type: "product",
        productId,
        sku: "LAYS-10",
        name: "Lay's",
        packageQuantity,
        unitQuantity,
        packagePrice: 1,
        unitPrice: 0.1,
        lineTotal: packageQuantity + unitQuantity * 0.1,
      },
    ],
  };
}

describe("resolveProductBaseUnitsNeed", () => {
  it("convierte presentaciones a unidades base", () => {
    expect(
      resolveProductBaseUnitsNeed(
        { presentationQuantity: 10, baseUnits: 0, sku: "X" },
        10,
      ),
    ).toBe(100);
  });
});

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
      presentationQuantity: 0,
      baseUnits: 2,
      sku: "LAYS-10",
      name: "Lay's",
    });
    expect(containers.get(containerId)).toEqual({
      need: 2,
      sku: "CAJA-M",
      name: "Caja mediana",
    });
  });

  it("acumula presentaciones y unidades en líneas producto", () => {
    const { products } = aggregateStockDemands(productCart(10));
    expect(products.get(productId)).toEqual({
      presentationQuantity: 10,
      baseUnits: 0,
      sku: "LAYS-10",
      name: "Lay's",
    });

    const mixed = aggregateStockDemands(productCart(1, 5));
    expect(mixed.products.get(productId)).toEqual({
      presentationQuantity: 1,
      baseUnits: 5,
      sku: "LAYS-10",
      name: "Lay's",
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
    productType: "package",
    stockSealedPackages: 5,
    stockLooseBaseUnits: 0,
    itemsPerPackage: 10,
  };

  it("passes when loose stock covers product line in presentations", () => {
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

    const result = checkOrderStock(productCart(3), products, new Map());
    expect(result).toEqual({ ok: true });
  });

  it("passes for 2 presentations with 5 sealed packages of 10", () => {
    const products = new Map<string, StockInventoryProduct>([
      [productId, laysProduct],
    ]);

    const result = checkOrderStock(productCart(2), products, new Map());
    expect(result).toEqual({ ok: true });
  });

  it("reports product shortage when presentations exceed stock", () => {
    const products = new Map<string, StockInventoryProduct>([
      [
        productId,
        { ...laysProduct, stockSealedPackages: 1, stockLooseBaseUnits: 0 },
      ],
    ]);

    const result = checkOrderStock(productCart(10), products, new Map());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.shortages[0]).toMatchObject({
      kind: "product",
      sku: "LAYS-10",
      required: 100,
      available: 10,
    });
  });

  it("reports shortage for more presentations than sealed packages allow", () => {
    const products = new Map<string, StockInventoryProduct>([
      [
        productId,
        { ...laysProduct, stockSealedPackages: 1, stockLooseBaseUnits: 0 },
      ],
    ]);

    const result = checkOrderStock(productCart(2), products, new Map());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.shortages[0]).toMatchObject({
      required: 20,
      available: 10,
    });
  });

  it("valida solo loose para productos unitarios", () => {
    const unitProductId = "44444444-4444-4444-4444-444444444444";
    const products = new Map<string, StockInventoryProduct>([
      [
        unitProductId,
        {
          id: unitProductId,
          sku: "MINI-CAN",
          name: "Mini cañonazo",
          productType: "unit",
          stockSealedPackages: 50,
          stockLooseBaseUnits: 8,
          itemsPerPackage: 1,
        },
      ],
    ]);

    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "product",
          productId: unitProductId,
          sku: "MINI-CAN",
          name: "Mini cañonazo",
          packageQuantity: 10,
          unitQuantity: 0,
          packagePrice: 1,
          unitPrice: 1,
          lineTotal: 10,
        },
      ],
    };

    const result = checkOrderStock(cart, products, new Map());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.shortages[0]).toMatchObject({
      required: 10,
      available: 8,
    });
  });

  it("deducts pack components as presentation quantities", () => {
    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "pack",
          packId: "55555555-5555-5555-5555-555555555555",
          sku: "COMBO-1",
          name: "Combo",
          quantity: 2,
          unitPrice: 20,
          lineTotal: 40,
          components: [
            {
              productId,
              productName: "Lay's",
              sku: "LAYS-10",
              packageQuantity: 2,
              unitQuantity: 0,
              totalPackages: 4,
              totalUnits: 0,
            },
          ],
        },
      ],
    };

    const products = new Map<string, StockInventoryProduct>([
      [productId, laysProduct],
    ]);

    const result = checkOrderStock(cart, products, new Map());
    expect(result.ok).toBe(true);
  });

  it("deducts pack dual qty (packages + units) into shared demand", () => {
    // need = 3×10 + 5 = 35 from 50 available → ok
    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "pack",
          packId: "55555555-5555-5555-5555-555555555555",
          sku: "COMBO-DUAL",
          name: "Combo Dual",
          quantity: 1,
          unitPrice: 35,
          lineTotal: 35,
          components: [
            {
              productId,
              productName: "Lay's",
              sku: "LAYS-10",
              packageQuantity: 3,
              unitQuantity: 5,
              totalPackages: 3,
              totalUnits: 5,
            },
          ],
        },
      ],
    };

    const products = new Map<string, StockInventoryProduct>([
      [productId, laysProduct],
    ]);

    expect(checkOrderStock(cart, products, new Map()).ok).toBe(true);
  });

  it("aggregates pack units with bundle baseUnits without double-counting presentations", () => {
    // pack: 1 presentation (10 base) + 2 units; bundle: 5 base → need 17 from 50
    const cart: OrderShoppingCart = {
      lines: [
        {
          type: "pack",
          packId: "55555555-5555-5555-5555-555555555555",
          sku: "COMBO-1",
          name: "Combo",
          quantity: 1,
          unitPrice: 12,
          lineTotal: 12,
          components: [
            {
              productId,
              productName: "Lay's",
              sku: "LAYS-10",
              packageQuantity: 1,
              unitQuantity: 2,
              totalPackages: 1,
              totalUnits: 2,
            },
          ],
        },
        {
          type: "bundle",
          bundleId: "33333333-3333-3333-3333-333333333333",
          name: "Sorpresa",
          quantity: 5,
          lineTotal: 50,
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
              totalQuantity: 5,
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
          stockQuantity: 10,
        },
      ],
    ]);

    expect(checkOrderStock(cart, products, containers).ok).toBe(true);
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

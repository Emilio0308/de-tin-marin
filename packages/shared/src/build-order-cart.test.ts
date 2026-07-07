import { describe, expect, it } from "vitest";
import {
  buildOrderCart,
  collectProductIdsFromOrderLines,
  resolveProductsForOrder,
} from "./build-order-cart";

const productA = {
  id: "p1",
  sku: "SKU-1",
  name: "Producto A",
  prices: { normal: { netPrice: 10 }, unit: { netPrice: 10 } },
  campaign_id: null,
  items_per_package: 1,
};

const productB = {
  id: "p2",
  sku: "SKU-2",
  name: "Producto B",
  prices: { normal: { netPrice: 5 }, unit: { netPrice: 5 } },
  campaign_id: null,
  items_per_package: 1,
};

describe("collectProductIdsFromOrderLines", () => {
  it("recoge ids de productos y componentes de bundle", () => {
    const ids = collectProductIdsFromOrderLines([
      { type: "product", productId: "p1", quantity: 1 },
      {
        type: "bundle",
        bundleId: "b1",
        quantity: 1,
        components: [
          { productId: "p2", quantityPerUnit: 2 },
          { productId: "p1", quantityPerUnit: 1 },
        ],
      },
    ]);

    expect(ids.sort()).toEqual(["p1", "p2"]);
  });
});

describe("resolveProductsForOrder", () => {
  it("mapea productos con precio unitario", () => {
    const map = resolveProductsForOrder([productA], []);
    expect(map.get("p1")).toEqual({
      id: "p1",
      sku: "SKU-1",
      name: "Producto A",
      unitPrice: 10,
    });
  });
});

describe("buildOrderCart", () => {
  it("construye carrito de producto simple", () => {
    const result = buildOrderCart({
      lines: [{ type: "product", productId: "p1", quantity: 2 }],
      products: [productA],
      campaigns: [],
      bundlesById: new Map(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.shoppingCart.lines).toHaveLength(1);
      expect(result.shoppingCart.lines[0]?.type).toBe("product");
    }
  });

  it("rechaza bundle inactivo", () => {
    const result = buildOrderCart({
      lines: [
        {
          type: "bundle",
          bundleId: "b1",
          quantity: 1,
          components: [{ productId: "p1", quantityPerUnit: 1 }],
        },
      ],
      products: [productA],
      campaigns: [],
      bundlesById: new Map([
        [
          "b1",
          {
            id: "b1",
            name: "Bundle",
            is_active: false,
            deleted_at: null,
            container: {
              id: "c1",
              sku: "C-1",
              name: "Caja",
              prices: { netPrice: 3 },
            },
          },
        ],
      ]),
    });

    expect(result).toEqual({ ok: false, error: "BUNDLE_NOT_FOUND" });
  });

  it("rechaza productos duplicados en bundle", () => {
    const result = buildOrderCart({
      lines: [
        {
          type: "bundle",
          bundleId: "b1",
          quantity: 1,
          components: [
            { productId: "p1", quantityPerUnit: 1 },
            { productId: "p1", quantityPerUnit: 2 },
          ],
        },
      ],
      products: [productA],
      campaigns: [],
      bundlesById: new Map([
        [
          "b1",
          {
            id: "b1",
            name: "Bundle",
            is_active: true,
            deleted_at: null,
            container: {
              id: "c1",
              sku: "C-1",
              name: "Caja",
              prices: { netPrice: 3 },
            },
          },
        ],
      ]),
    });

    expect(result).toEqual({
      ok: false,
      error: "DUPLICATE_PRODUCT_IN_BUNDLE",
    });
  });

  it("construye bundle con productos válidos", () => {
    const result = buildOrderCart({
      lines: [
        {
          type: "bundle",
          bundleId: "b1",
          quantity: 1,
          components: [
            { productId: "p1", quantityPerUnit: 1 },
            { productId: "p2", quantityPerUnit: 2 },
          ],
        },
      ],
      products: [productA, productB],
      campaigns: [],
      bundlesById: new Map([
        [
          "b1",
          {
            id: "b1",
            name: "Combo Fiesta",
            is_active: true,
            deleted_at: null,
            container: {
              id: "c1",
              sku: "C-1",
              name: "Caja sorpresa",
              prices: { netPrice: 5 },
            },
          },
        ],
      ]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.shoppingCart.lines[0]?.type).toBe("bundle");
    }
  });
});

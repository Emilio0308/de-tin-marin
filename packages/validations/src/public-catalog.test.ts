import { describe, expect, it } from "vitest";
import {
  paginateItems,
  parsePublicBundleListQuery,
  parsePublicPackListQuery,
  parsePublicProductListQuery,
  sortPublicBundles,
  sortPublicPacks,
  sortPublicProducts,
} from "./public-catalog";

describe("parsePublicProductListQuery", () => {
  it("aplica defaults de paginación y orden", () => {
    const result = parsePublicProductListQuery({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        page: 1,
        pageSize: 12,
        sort: "name_asc",
      });
    }
  });

  it("limita pageSize al máximo", () => {
    const result = parsePublicProductListQuery({ pageSize: 100 });
    expect(result.ok).toBe(false);
  });
});

describe("parsePublicBundleListQuery", () => {
  it("acepta búsqueda por nombre", () => {
    const result = parsePublicBundleListQuery({ search: "fiesta" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.search).toBe("fiesta");
    }
  });
});

describe("parsePublicPackListQuery", () => {
  it("aplica defaults y acepta búsqueda", () => {
    const result = parsePublicPackListQuery({ search: "combo" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        page: 1,
        pageSize: 12,
        sort: "name_asc",
        search: "combo",
      });
    }
  });
});

describe("paginateItems", () => {
  it("no repite ítems entre páginas", () => {
    const items = Array.from({ length: 5 }, (_, index) => index + 1);
    const page1 = paginateItems(items, 1, 2);
    const page2 = paginateItems(items, 2, 2);

    expect(page1.items).toEqual([1, 2]);
    expect(page2.items).toEqual([3, 4]);
    expect(page1.total).toBe(5);
  });
});

describe("sortPublicProducts", () => {
  const items = [
    { name: "Zebra", finalPrice: 10 },
    { name: "Alfa", finalPrice: 5 },
    { name: "Beta", finalPrice: 20 },
  ];

  it("ordena por precio ascendente", () => {
    const sorted = sortPublicProducts(items, "price_asc");
    expect(sorted.map((item) => item.finalPrice)).toEqual([5, 10, 20]);
  });

  it("ordena por nombre descendente", () => {
    const sorted = sortPublicProducts(items, "name_desc");
    expect(sorted.map((item) => item.name)).toEqual(["Zebra", "Beta", "Alfa"]);
  });
});

describe("sortPublicBundles", () => {
  it("ordena por total descendente", () => {
    const sorted = sortPublicBundles(
      [
        { name: "A", total: 30 },
        { name: "B", total: 10 },
      ],
      "price_desc",
    );
    expect(sorted.map((item) => item.total)).toEqual([30, 10]);
  });
});

describe("sortPublicPacks", () => {
  it("ordena por finalPrice ascendente", () => {
    const sorted = sortPublicPacks(
      [
        { name: "B", finalPrice: 40 },
        { name: "A", finalPrice: 20 },
      ],
      "price_asc",
    );
    expect(sorted.map((item) => item.finalPrice)).toEqual([20, 40]);
  });
});

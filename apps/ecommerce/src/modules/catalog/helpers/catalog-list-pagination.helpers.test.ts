import { describe, expect, it } from "vitest";
import {
  orderRowsByIds,
  parseCatalogListRpcPayload,
  productListRange,
} from "./catalog-list-pagination.helpers";

describe("productListRange", () => {
  it("page 1 range no overlaps page 2 range", () => {
    const page1 = productListRange(1, 12);
    const page2 = productListRange(2, 12);

    expect(page1).toEqual({ from: 0, to: 11 });
    expect(page2).toEqual({ from: 12, to: 23 });
    expect(page1.to).toBeLessThan(page2.from);
  });

  it("limits span to pageSize", () => {
    const range = productListRange(3, 12);
    expect(range.to - range.from + 1).toBe(12);
  });
});

describe("orderRowsByIds", () => {
  it("preserves RPC order and drops missing ids", () => {
    const rows = [
      { id: "b", name: "B" },
      { id: "a", name: "A" },
    ];
    expect(orderRowsByIds(rows, ["a", "missing", "b"])).toEqual([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
  });
});

describe("parseCatalogListRpcPayload", () => {
  it("parses ids and total from jsonb payload", () => {
    expect(
      parseCatalogListRpcPayload({
        total: 25,
        ids: ["a", "b"],
      }),
    ).toEqual({ ids: ["a", "b"], total: 25 });
  });

  it("keeps total when ids are empty (page past end)", () => {
    expect(parseCatalogListRpcPayload({ total: 25, ids: [] })).toEqual({
      ids: [],
      total: 25,
    });
  });

  it("returns zeros for invalid payload", () => {
    expect(parseCatalogListRpcPayload(null)).toEqual({ ids: [], total: 0 });
  });
});

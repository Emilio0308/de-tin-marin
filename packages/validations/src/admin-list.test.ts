import { describe, expect, it } from "vitest";
import {
  adminCategoryListQuerySchema,
  adminListPageBounds,
  adminListRange,
  adminProductListQuerySchema,
} from "./admin-list";

describe("adminListRange", () => {
  it("computes non-overlapping page windows", () => {
    expect(adminListRange(1, 20)).toEqual({ from: 0, to: 19 });
    expect(adminListRange(2, 20)).toEqual({ from: 20, to: 39 });
  });
});

describe("adminListPageBounds", () => {
  it("formats 1-based inclusive bounds for UI copy", () => {
    expect(adminListPageBounds(1, 20, 45, 20)).toEqual({ from: 1, to: 20 });
    expect(adminListPageBounds(3, 20, 45, 5)).toEqual({ from: 41, to: 45 });
  });

  it("returns zeros when empty", () => {
    expect(adminListPageBounds(1, 20, 0, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe("adminProductListQuerySchema", () => {
  it("applies defaults", () => {
    const parsed = adminProductListQuerySchema.parse({});
    expect(parsed).toEqual({
      page: 1,
      pageSize: 20,
      status: "all",
    });
  });

  it("rejects oversized pageSize", () => {
    expect(
      adminProductListQuerySchema.safeParse({ pageSize: 100 }).success,
    ).toBe(false);
  });
});

describe("adminCategoryListQuerySchema", () => {
  it("accepts search and status", () => {
    const parsed = adminCategoryListQuerySchema.parse({
      search: "dulces",
      status: "active",
      page: 2,
    });
    expect(parsed.search).toBe("dulces");
    expect(parsed.status).toBe("active");
    expect(parsed.page).toBe(2);
  });
});

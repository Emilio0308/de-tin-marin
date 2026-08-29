import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { shouldRefreshSession } from "./proxy";

function makeRequest(
  method: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost/products", {
    method,
    headers,
  });
}

describe("shouldRefreshSession", () => {
  it("refreshes on GET without Next-Action", () => {
    expect(shouldRefreshSession(makeRequest("GET"))).toBe(true);
  });

  it("skips POST (Server Actions)", () => {
    expect(shouldRefreshSession(makeRequest("POST"))).toBe(false);
  });

  it("skips GET with Next-Action header", () => {
    expect(
      shouldRefreshSession(makeRequest("GET", { "Next-Action": "abc" })),
    ).toBe(false);
    expect(
      shouldRefreshSession(makeRequest("GET", { "next-action": "abc" })),
    ).toBe(false);
  });
});

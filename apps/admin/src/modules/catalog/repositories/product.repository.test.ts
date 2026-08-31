import { describe, expect, it } from "vitest";
import { isPostgrestRangeNotSatisfiableError } from "./product.repository";

describe("isPostgrestRangeNotSatisfiableError", () => {
  it("detects PostgREST 416 message", () => {
    expect(
      isPostgrestRangeNotSatisfiableError("Requested range not satisfiable"),
    ).toBe(true);
  });

  it("is case insensitive", () => {
    expect(isPostgrestRangeNotSatisfiableError("RANGE NOT SATISFIABLE")).toBe(
      true,
    );
  });

  it("returns false for other errors", () => {
    expect(isPostgrestRangeNotSatisfiableError("permission denied")).toBe(
      false,
    );
  });
});

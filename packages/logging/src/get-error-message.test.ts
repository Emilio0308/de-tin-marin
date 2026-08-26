import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
  it("reads Error.message", () => {
    expect(getErrorMessage(new Error("x"))).toBe("x");
  });

  it("reads Supabase-like objects", () => {
    expect(
      getErrorMessage({
        message: "fail",
        code: "42501",
        details: "denied",
        hint: "check rls",
      }),
    ).toBe("fail | code=42501 | details=denied | hint=check rls");
  });
});

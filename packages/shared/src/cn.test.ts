import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges tailwind classes with last-wins semantics", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

import { describe, expect, it } from "vitest";
import { slugFromName } from "./category-form.helpers";

describe("category-form.helpers", () => {
  it("slugFromName produces url-safe slug", () => {
    expect(slugFromName("Chocolates Premium")).toBe("chocolates-premium");
  });
});

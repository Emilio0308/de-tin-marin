import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts name to url-safe slug", () => {
    expect(slugify("Chocolate Artesanal")).toBe("chocolate-artesanal");
  });

  it("removes accents", () => {
    expect(slugify("Dulce de Leche")).toBe("dulce-de-leche");
  });

  it("handles special characters", () => {
    expect(slugify("  Hello & World!  ")).toBe("hello-world");
  });
});

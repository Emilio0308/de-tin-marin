import { describe, expect, it } from "vitest";
import { isAdminNavLinkActive } from "./admin-nav.helpers";

describe("isAdminNavLinkActive", () => {
  it("marca dashboard solo en la raíz", () => {
    expect(isAdminNavLinkActive("/", "/")).toBe(true);
    expect(isAdminNavLinkActive("/products", "/")).toBe(false);
  });

  it("marca rutas hijas como activas", () => {
    expect(isAdminNavLinkActive("/products/new", "/products")).toBe(true);
    expect(isAdminNavLinkActive("/products/abc/edit", "/products")).toBe(true);
    expect(isAdminNavLinkActive("/products-old", "/products")).toBe(false);
  });
});

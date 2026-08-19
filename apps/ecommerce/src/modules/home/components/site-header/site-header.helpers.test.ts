import { Candy, Gift, Heart } from "lucide-react";
import { describe, expect, it } from "vitest";
import { getSiteNavLinkIcon, isCatalogNavLink } from "./site-header.helpers";

describe("site-header.helpers", () => {
  it("identifica enlaces de catálogo", () => {
    expect(isCatalogNavLink("/?tab=productos")).toBe(true);
    expect(isCatalogNavLink("/mis-pedidos")).toBe(false);
  });

  it("asigna iconos según la ruta", () => {
    expect(getSiteNavLinkIcon("/?tab=sorpresas")).toBe(Gift);
    expect(getSiteNavLinkIcon("/nosotros")).toBe(Heart);
    expect(getSiteNavLinkIcon("/?tab=productos")).toBe(Candy);
  });
});

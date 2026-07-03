import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";
import type { HomeNavLink } from "@/modules/home/types/home.types";

const navLinks: HomeNavLink[] = [
  { label: "Sweets", href: "#sweets" },
  { label: "Surprises", href: "#surprises" },
];

describe("SiteHeader", () => {
  it("renderiza el logo y los enlaces de navegación", () => {
    render(<SiteHeader navLinks={navLinks} activeIndex={0} scrolled={false} />);

    expect(
      screen.getByRole("link", { name: "De Tin Marín" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sweets" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Surprises" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ver carrito/i }),
    ).toBeInTheDocument();
  });
});

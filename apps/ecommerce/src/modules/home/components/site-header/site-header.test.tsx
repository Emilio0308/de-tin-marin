import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";
import type { HomeNavLink } from "@/modules/home/types/home.types";

const navLinks: HomeNavLink[] = [
  { label: "Dulces", href: "/?tab=productos" },
  { label: "Sorpresas", href: "/?tab=sorpresas" },
  { label: "Mis pedidos", href: "/mis-pedidos" },
];

describe("SiteHeader", () => {
  it("renderiza el logo y los enlaces de navegación", () => {
    render(
      <SiteHeader
        navLinks={navLinks}
        activeIndex={0}
        scrolled={false}
        cartCount={0}
      />,
    );

    expect(
      screen.getByRole("link", { name: "De Tin Marín" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dulces" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sorpresas" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation")).getByRole("link", {
        name: "Mis pedidos",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver carrito/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mis pedidos")).toBeInTheDocument();
  });

  it("no resalta ningún enlace cuando activeIndex es -1", () => {
    render(
      <SiteHeader
        navLinks={navLinks}
        activeIndex={-1}
        scrolled={false}
        cartCount={2}
      />,
    );

    const sweetsLink = screen.getByRole("link", { name: "Dulces" });
    expect(sweetsLink.className).not.toMatch(/border-primary/);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";
import type { HomeNavLink } from "@/modules/home/types/home.types";

const navLinks: HomeNavLink[] = [
  { label: "Dulces", href: "/productos" },
  { label: "Sorpresas", href: "/sorpresas" },
];

describe("SiteHeader", () => {
  it("renderiza el logo y los enlaces de navegación", () => {
    render(<SiteHeader navLinks={navLinks} activeIndex={0} scrolled={false} />);

    expect(
      screen.getByRole("link", { name: "De Tin Marín" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dulces" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sorpresas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ver carrito/i }),
    ).toBeInTheDocument();
  });

  it("no resalta ningún enlace cuando activeIndex es -1", () => {
    render(
      <SiteHeader navLinks={navLinks} activeIndex={-1} scrolled={false} />,
    );

    const sweetsLink = screen.getByRole("link", { name: "Dulces" });
    expect(sweetsLink.className).not.toMatch(/border-primary/);
  });
});

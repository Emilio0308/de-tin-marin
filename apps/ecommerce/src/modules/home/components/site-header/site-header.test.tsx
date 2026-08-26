import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";
import type { HomeNavLink } from "@/modules/home/types/home.types";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) => (key: string, values?: { count?: number }) => {
      const catalogs: Record<string, Record<string, string>> = {
        nav: {
          sweets: "Dulces",
          surprises: "Sorpresas",
          combos: "Combos",
          myOrders: "Mis pedidos",
          about: "Nosotros",
          menuTitle: "Menú",
          openMenu: "Abrir menú",
          closeMenu: "Cerrar menú",
          cart: "Carrito",
          cartWithCount: "Ver carrito ({count})",
          "sections.explore": "Explorar",
          "sections.account": "Tu cuenta",
        },
      };

      const template = catalogs[namespace]?.[key] ?? key;
      if (values?.count !== undefined) {
        return template.replace("{count}", String(values.count));
      }

      return template;
    },
}));

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
    expect(screen.getByRole("link", { name: /carrito/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Mis pedidos")).toBeInTheDocument();
  });

  it("resalta el enlace activo en desktop", () => {
    render(
      <SiteHeader
        navLinks={navLinks}
        activeIndex={0}
        scrolled={false}
        cartCount={2}
      />,
    );

    const sweetsLink = screen.getByRole("link", { name: "Dulces" });
    expect(sweetsLink.className).toMatch(/bg-primary-fixed/);
  });
});

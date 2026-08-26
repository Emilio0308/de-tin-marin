import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "./site-footer";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const catalogs: Record<string, Record<string, string>> = {
      footer: {
        explore: "Explora",
        help: "Ayuda",
        subscribe: "Suscríbete",
        subscribeEmailPlaceholder: "Tu email",
        subscribeEmailAria: "Correo para suscripción",
        subscribeSubmitAria: "Suscribirse",
        tagline: "Endulzamos cada mañana de cumpleaños con magia y sabor.",
        copyright: "© 2026 De Tin Marín. Endulzando cada mañana de cumpleaños.",
        contact: "Contáctanos",
        privacy: "Política de privacidad",
        terms: "Términos y condiciones",
        homeAria: "Ir al inicio",
      },
      nav: {
        sweets: "Dulces",
        surprises: "Sorpresas",
        combos: "Combos",
        myOrders: "Mis pedidos",
        about: "Nosotros",
      },
    };
    return catalogs[namespace]?.[key] ?? key;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe("SiteFooter", () => {
  it("renderiza enlaces a rutas reales y el formulario de suscripción", () => {
    render(<SiteFooter />);

    expect(screen.getByText("Explora")).toBeInTheDocument();
    expect(screen.getByText("Ayuda")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Dulces" })).toHaveAttribute(
      "href",
      "/?tab=productos",
    );
    expect(screen.getByRole("link", { name: "Sorpresas" })).toHaveAttribute(
      "href",
      "/?tab=sorpresas",
    );
    expect(screen.getByRole("link", { name: "Combos" })).toHaveAttribute(
      "href",
      "/?tab=combos",
    );
    expect(screen.getByRole("link", { name: "Mis pedidos" })).toHaveAttribute(
      "href",
      "/mis-pedidos",
    );
    expect(screen.getByRole("link", { name: "Contáctanos" })).toHaveAttribute(
      "href",
      "/nosotros",
    );
    expect(
      screen.getByRole("link", { name: "Política de privacidad" }),
    ).toHaveAttribute("href", "/politica-de-privacidad");
    expect(
      screen.getByRole("link", { name: "Términos y condiciones" }),
    ).toHaveAttribute("href", "/terminos-y-condiciones");
    expect(
      screen.getByRole("button", { name: /suscribirse/i }),
    ).toBeInTheDocument();
  });
});

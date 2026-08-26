import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildTermsContent } from "@/modules/terms/data/terms.data";
import { TermsPage } from "./terms-page";

const TERMS_CONTENT = buildTermsContent({
  email: "detinmarindulcesyconfiteria@gmail.com",
  emailHref: "mailto:detinmarindulcesyconfiteria@gmail.com",
  whatsappDisplay: "+51 980 966 238",
  whatsappHref: "https://wa.me/51980966238",
});

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const labels: Record<string, string> = {
      eyebrow: "Términos y Condiciones",
      giftTag: "Antes de tu sorpresa",
      heroTitle: "Todo claro antes de tu sorpresa",
      heroDescription:
        "Estos términos explican las condiciones para comprar en De Tin Marín.",
      lastUpdated: `Última actualización: ${values?.date ?? ""}`,
      tocLabel: "Contenido",
      contactEmail: "Correo",
      contactWhatsapp: "WhatsApp",
      contactFooterNote:
        "Estamos aquí para ayudarte con cualquier duda sobre una compra o estos términos.",
    };
    return labels[key] ?? key;
  },
}));

describe("TermsPage", () => {
  it("renderiza hero, secciones y contacto", () => {
    render(<TermsPage content={TERMS_CONTENT} />);

    expect(
      screen.getByRole("heading", {
        name: /Todo claro antes de tu sorpresa/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(`Última actualización: ${TERMS_CONTENT.lastUpdated}`),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "1. Sobre De Tin Marín" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "15. Contacto" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "9. Cambios, cancelaciones y devoluciones",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("navigation", { name: "Contenido" }),
    ).toBeInTheDocument();

    const emailLinks = screen.getAllByRole("link", {
      name: TERMS_CONTENT.contact.email,
    });
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0]).toHaveAttribute(
      "href",
      TERMS_CONTENT.contact.emailHref,
    );

    const whatsapp = screen.getAllByRole("link", {
      name: TERMS_CONTENT.contact.whatsappDisplay,
    });
    expect(whatsapp[0]).toHaveAttribute(
      "href",
      TERMS_CONTENT.contact.whatsappHref,
    );
  });
});

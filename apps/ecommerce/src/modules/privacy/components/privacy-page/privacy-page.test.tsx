import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PRIVACY_CONTENT,
  PRIVACY_EMAIL,
  PRIVACY_EMAIL_HREF,
  PRIVACY_WHATSAPP_HREF,
} from "@/modules/privacy/data/privacy.data";
import { PrivacyPage } from "./privacy-page";

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
      eyebrow: "Política de Privacidad",
      heroTitle: "Tu privacidad también nos importa",
      heroDescription:
        "En De Tin Marín queremos que disfrutes de tu experiencia con tranquilidad.",
      lastUpdated: `Última actualización: ${values?.date ?? ""}`,
      tocLabel: "Contenido",
      contactEmail: "Correo",
      contactWhatsapp: "WhatsApp",
      contactLegalName: "Titular",
      contactFooterNote:
        "Estamos para ayudarte con cualquier duda sobre el tratamiento de tus datos.",
    };
    return labels[key] ?? key;
  },
}));

describe("PrivacyPage", () => {
  it("renderiza hero, secciones y contacto", () => {
    render(<PrivacyPage content={PRIVACY_CONTENT} />);

    expect(
      screen.getByRole("heading", {
        name: /Tu privacidad también nos importa/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(`Última actualización: ${PRIVACY_CONTENT.lastUpdated}`),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "1. ¿Qué información recopilamos?",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "10. Contacto" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("navigation", { name: "Contenido" }),
    ).toBeInTheDocument();

    const emailLinks = screen.getAllByRole("link", { name: PRIVACY_EMAIL });
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0]).toHaveAttribute("href", PRIVACY_EMAIL_HREF);

    const whatsapp = screen.getAllByRole("link", {
      name: PRIVACY_CONTENT.contact.whatsappDisplay,
    });
    expect(whatsapp[0]).toHaveAttribute("href", PRIVACY_WHATSAPP_HREF);
  });
});

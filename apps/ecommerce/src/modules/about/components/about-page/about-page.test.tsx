import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ABOUT_BRAND_CONTENT,
  ABOUT_CONTACT_LINKS,
  ABOUT_EMAIL_HREF,
  ABOUT_WHATSAPP_HREF,
} from "@/modules/about/data/about.data";
import { AboutPage } from "./about-page";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      storyTitle: "Nuestra Historia",
      storyImageAlt: "Selección de dulces artesanales de colores",
      missionTitle: "Nuestra Misión",
      visionTitle: "Nuestra Visión",
      valuesTitle: "Lo que nos mueve",
      contactTitle: "¿Quieres conocernos más?",
      contactSubtitle:
        "Estamos listos para escucharte y ayudarte a crear el detalle perfecto. ¡Hablemos de dulzura!",
      whatsappCta: "Escríbenos por WhatsApp",
      socialInstagram: "Instagram",
      socialTiktok: "TikTok",
      socialFacebook: "Facebook",
      socialEmail: "Gmail",
    };
    return labels[key] ?? key;
  },
}));

describe("AboutPage", () => {
  it("renderiza historia, misión, visión y CTA de contacto", () => {
    render(
      <AboutPage content={ABOUT_BRAND_CONTENT} contact={ABOUT_CONTACT_LINKS} />,
    );

    expect(
      screen.getByRole("heading", { name: "Nuestra Historia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nuestra Misión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nuestra Visión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(ABOUT_BRAND_CONTENT.missionBody),
    ).toBeInTheDocument();
    expect(
      screen.getByText(ABOUT_BRAND_CONTENT.visionBody),
    ).toBeInTheDocument();

    const whatsapp = screen.getByRole("link", {
      name: "Escríbenos por WhatsApp",
    });
    expect(whatsapp).toHaveAttribute("href", ABOUT_WHATSAPP_HREF);
    expect(whatsapp).toHaveAttribute("target", "_blank");

    const email = screen.getByRole("link", { name: "Gmail" });
    expect(email).toHaveAttribute("href", ABOUT_EMAIL_HREF);
  });
});

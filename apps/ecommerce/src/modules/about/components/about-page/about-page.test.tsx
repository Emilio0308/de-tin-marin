import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ABOUT_BRAND_CONTENT,
  ABOUT_FACEBOOK_HREF,
  ABOUT_TIKTOK_HREF,
  type AboutContactLinks,
} from "@/modules/about/data/about.data";
import { AboutPage } from "./about-page";

const contact: AboutContactLinks = {
  whatsappHref: "https://wa.me/51980966238",
  whatsappDisplay: "+51 980 966 238",
  emailHref: "mailto:detinmarindulcesyconfiteria@gmail.com",
  email: "detinmarindulcesyconfiteria@gmail.com",
  facebookHref: ABOUT_FACEBOOK_HREF,
  tiktokHref: ABOUT_TIKTOK_HREF,
};

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
      socialTiktok: "TikTok",
      socialFacebook: "Facebook",
      socialEmail: "Gmail",
    };
    return labels[key] ?? key;
  },
}));

describe("AboutPage", () => {
  it("renderiza historia, misión, visión y CTA de contacto", () => {
    render(<AboutPage content={ABOUT_BRAND_CONTENT} contact={contact} />);

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
    expect(whatsapp).toHaveAttribute("href", contact.whatsappHref);
    expect(whatsapp).toHaveAttribute("target", "_blank");

    const email = screen.getByRole("link", { name: "Gmail" });
    expect(email).toHaveAttribute("href", contact.emailHref);

    expect(
      screen.getByRole("img", {
        name: "Selección de dulces artesanales de colores",
      }),
    ).toHaveAttribute("src", ABOUT_BRAND_CONTENT.storyImageUrl);
  });

  it("muestra la URL personalizada de Nuestra Historia", () => {
    const customUrl = "https://cdn.example.com/nosotros.jpg";
    render(
      <AboutPage
        content={{ ...ABOUT_BRAND_CONTENT, storyImageUrl: customUrl }}
        contact={contact}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Selección de dulces artesanales de colores",
      }),
    ).toHaveAttribute("src", customUrl);
  });
});

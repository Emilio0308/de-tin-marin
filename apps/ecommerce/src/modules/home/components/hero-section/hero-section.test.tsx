import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "./hero-section";
import {
  FALLBACK_HERO_IMAGE_URL,
  resolveHeroSlides,
  shouldUseCarousel,
} from "./hero-section.helpers";

const defaultProps = {
  titlePrefix: "¡Endulza cada ",
  titleHighlight: "sorpresa!",
  description: "Descripción del hero.",
  ctaSurprises: "Ver sorpresas",
  ctaProducts: "Ver dulces",
  imageAlt: "Caja de regalo con dulces",
  favoriteKit: "Kit Favorito",
  displayMode: "static" as const,
  slides: [
    {
      imageUrl: "https://cdn.example.com/hero/a.png",
      altText: null,
    },
  ],
  prevLabel: "Anterior",
  nextLabel: "Siguiente",
};

describe("HeroSection", () => {
  it("renderiza el título principal y las llamadas a la acción", () => {
    render(<HeroSection {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /endulza cada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver sorpresas/i }),
    ).toHaveAttribute("href", "/?tab=sorpresas");
    expect(screen.getByRole("link", { name: /ver dulces/i })).toHaveAttribute(
      "href",
      "/?tab=productos",
    );
  });

  it("muestra controles de carrusel cuando hay múltiples slides", () => {
    render(
      <HeroSection
        {...defaultProps}
        displayMode="carousel"
        slides={[
          { imageUrl: "https://cdn.example.com/1.png", altText: null },
          { imageUrl: "https://cdn.example.com/2.png", altText: "Dos" },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: /anterior/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /siguiente/i }),
    ).toBeInTheDocument();
  });
});

describe("resolveHeroSlides", () => {
  it("usa fallback si hay error o lista vacía", () => {
    expect(resolveHeroSlides({ slides: [], error: false })).toEqual([
      { imageUrl: FALLBACK_HERO_IMAGE_URL, altText: null },
    ]);
    expect(resolveHeroSlides({ slides: undefined, error: true })).toEqual([
      { imageUrl: FALLBACK_HERO_IMAGE_URL, altText: null },
    ]);
  });

  it("devuelve slides cuando hay datos", () => {
    const slides = [
      { imageUrl: "https://cdn.example.com/a.png", altText: "A" },
    ];
    expect(resolveHeroSlides({ slides, error: false })).toEqual(slides);
  });
});

describe("shouldUseCarousel", () => {
  it("solo activa carrusel con modo carousel y más de un slide", () => {
    expect(shouldUseCarousel("static", 3)).toBe(false);
    expect(shouldUseCarousel("carousel", 1)).toBe(false);
    expect(shouldUseCarousel("carousel", 2)).toBe(true);
  });
});

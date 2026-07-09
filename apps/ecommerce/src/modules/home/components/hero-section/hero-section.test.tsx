import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "./hero-section";

const defaultProps = {
  titlePrefix: "¡Endulza cada ",
  titleHighlight: "sorpresa!",
  description: "Descripción del hero.",
  ctaSurprises: "Ver sorpresas",
  ctaProducts: "Ver dulces",
  imageAlt: "Caja de regalo con dulces",
  favoriteKit: "Kit Favorito",
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
});

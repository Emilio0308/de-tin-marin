import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BundleCard } from "./bundle-card";
import type { HomeBundle } from "@/modules/home/types/home.types";

const bundle: HomeBundle = {
  id: "combo",
  name: "Combo Fiesta",
  price: 45,
  imageUrl: "https://example.com/combo.png",
  imageAlt: "Combo fiesta",
  features: [
    { id: "dulces", label: "24 Dulces variados" },
    { id: "caja", label: "Caja de regalo Premium" },
  ],
};

describe("BundleCard", () => {
  it("renderiza nombre, precio y features en variante listing", () => {
    render(
      <BundleCard
        bundle={bundle}
        personalizeLabel="Lo quiero"
        variant="listing"
      />,
    );

    expect(screen.getByText("Combo Fiesta")).toBeInTheDocument();
    expect(screen.getByText("S/45.00")).toBeInTheDocument();
    expect(screen.getByText("24 Dulces variados")).toBeInTheDocument();
    expect(screen.getByText("Caja de regalo Premium")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveClass("border-primary");
  });

  it("renderiza link de personalizar en variante listing", () => {
    render(
      <BundleCard
        bundle={{
          ...bundle,
          name: "Pack test con nombre mucho más largo para validar wrapping",
          features: [
            {
              id: "feature-larga",
              label:
                "Una característica bastante larga para verificar que el texto pueda envolver sin desbordarse",
            },
          ],
        }}
        detailHref="/sorpresas/combo"
        personalizeLabel="Personalizar"
        priceLabel="Precio"
        variant="listing"
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Pack test con nombre mucho más largo para validar wrapping",
      }),
    ).toHaveAttribute("href", "/sorpresas/combo");
    expect(screen.getByRole("link", { name: "Personalizar" })).toHaveAttribute(
      "href",
      "/sorpresas/combo/personalizar",
    );
    expect(screen.getByText("Precio")).toBeInTheDocument();
  });

  it("usa borde de sorpresa en variante featured", () => {
    render(<BundleCard bundle={bundle} variant="featured" />);

    expect(screen.getByRole("article")).toHaveClass("surprise-card-border");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PackCard } from "./pack-card";

describe("PackCard", () => {
  it("renderiza nombre, precio y CTA a detalle", () => {
    render(
      <PackCard
        pack={{
          id: "pack-1",
          name: "Combo Fiesta",
          price: 49.9,
          imageUrl: "https://example.com/combo.png",
          imageAlt: "Combo Fiesta",
          features: [{ id: "f1", label: "Gomitas × 2" }],
        }}
        detailHref="/combos/combo-fiesta"
        viewComboLabel="Ver combo"
        priceLabel="Precio"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Combo Fiesta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("S/49.90")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver combo" })).toHaveAttribute(
      "href",
      "/combos/combo-fiesta",
    );
  });
});

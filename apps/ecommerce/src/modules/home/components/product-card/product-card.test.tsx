import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";
import type { HomeProduct } from "@/modules/home/types/home.types";

const baseProduct: HomeProduct = {
  id: "paleta",
  name: "Paleta Arcoiris",
  price: 5.5,
  imageUrl: "https://example.com/paleta.png",
  imageAlt: "Paleta arcoíris",
};

describe("ProductCard", () => {
  it("renderiza nombre, precio formateado e imagen", () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText("Paleta Arcoiris")).toBeInTheDocument();
    expect(screen.getByText("$5.50")).toBeInTheDocument();
    expect(screen.getByAltText("Paleta arcoíris")).toBeInTheDocument();
  });

  it("muestra el badge solo cuando está presente", () => {
    const { rerender } = render(<ProductCard product={baseProduct} />);
    expect(screen.queryByText("Nuevo")).not.toBeInTheDocument();

    rerender(<ProductCard product={{ ...baseProduct, badge: "Nuevo" }} />);
    expect(screen.getByText("Nuevo")).toBeInTheDocument();
  });
});

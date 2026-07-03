import { Candy, Cookie } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCatalog } from "./product-catalog";
import type {
  HomeCategory,
  HomeProduct,
} from "@/modules/home/types/home.types";

const categories: HomeCategory[] = [
  { id: "caramelos", label: "Caramelos", icon: Candy },
  { id: "chocolates", label: "Chocolates", icon: Cookie },
];

const products: HomeProduct[] = [
  {
    id: "p1",
    name: "Paleta",
    price: 5.5,
    imageUrl: "https://example.com/p1.png",
    imageAlt: "Paleta",
  },
  {
    id: "p2",
    name: "Trufas",
    price: 12,
    imageUrl: "https://example.com/p2.png",
    imageAlt: "Trufas",
  },
];

describe("ProductCatalog", () => {
  it("renderiza categorías y productos", () => {
    render(
      <ProductCatalog
        categories={categories}
        products={products}
        activeCategoryId="caramelos"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /catálogo completo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paleta")).toBeInTheDocument();
    expect(screen.getByText("Trufas")).toBeInTheDocument();
    expect(screen.getByText("Caramelos")).toBeInTheDocument();
  });
});

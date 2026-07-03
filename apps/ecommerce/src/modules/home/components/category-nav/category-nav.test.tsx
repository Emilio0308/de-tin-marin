import { Candy, Cookie } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryNav } from "./category-nav";
import type { HomeCategory } from "@/modules/home/types/home.types";

const categories: HomeCategory[] = [
  { id: "caramelos", label: "Caramelos", icon: Candy },
  { id: "chocolates", label: "Chocolates", icon: Cookie },
];

describe("CategoryNav", () => {
  it("renderiza todas las categorías", () => {
    render(<CategoryNav categories={categories} activeId="caramelos" />);

    expect(screen.getByText("Caramelos")).toBeInTheDocument();
    expect(screen.getByText("Chocolates")).toBeInTheDocument();
  });

  it("marca la categoría activa con aria-pressed", () => {
    render(<CategoryNav categories={categories} activeId="caramelos" />);

    expect(screen.getByRole("button", { name: /caramelos/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /chocolates/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

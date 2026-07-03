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
  it("renderiza nombre, precio y features", () => {
    render(<BundleCard bundle={bundle} />);

    expect(screen.getByText("Combo Fiesta")).toBeInTheDocument();
    expect(screen.getByText("$45.00")).toBeInTheDocument();
    expect(screen.getByText("24 Dulces variados")).toBeInTheDocument();
    expect(screen.getByText("Caja de regalo Premium")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BundleSection } from "./bundle-section";
import type { HomeBundle } from "@/modules/home/types/home.types";

const bundles: HomeBundle[] = [
  {
    id: "combo-a",
    name: "Combo A",
    price: 45,
    imageUrl: "https://example.com/a.png",
    imageAlt: "Combo A",
    features: [{ id: "f1", label: "Feature A" }],
  },
  {
    id: "combo-b",
    name: "Combo B",
    price: 32,
    imageUrl: "https://example.com/b.png",
    imageAlt: "Combo B",
    features: [{ id: "f2", label: "Feature B" }],
  },
];

describe("BundleSection", () => {
  it("renderiza el título y una tarjeta por bundle", () => {
    render(<BundleSection bundles={bundles} />);

    expect(
      screen.getByRole("heading", { name: /combos cumpleañeros/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Combo A")).toBeInTheDocument();
    expect(screen.getByText("Combo B")).toBeInTheDocument();
  });
});

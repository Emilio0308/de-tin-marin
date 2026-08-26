import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicPackDetail } from "@de-tin-marin/validations/public-catalog";
import { PackDetailPage } from "./pack-detail-page";

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

const basePack: PublicPackDetail = {
  id: "11111111-1111-1111-1111-111111111111",
  sku: "PACK-001",
  slug: "combo-fiesta",
  name: "Combo Fiesta",
  imageUrl: "https://example.com/combo.png",
  finalPrice: 49.9,
  itemCount: 2,
  purchaseMinQuantity: 1,
  purchaseMaxQuantity: 10,
  availableQuantity: 5,
  isPurchasable: true,
  itemsPreview: [],
  description: "Un combo para celebrar.",
  items: [
    {
      productId: "22222222-2222-2222-2222-222222222222",
      productName: "Chisitos",
      description: "Snack crocante de maíz.",
      imageUrl: "https://example.com/chisitos.png",
      packageQuantity: 2,
      unitQuantity: 0,
      itemsPerPackage: 12,
      productType: "package",
      packageLabel: "paquete",
    },
  ],
};

const labels = {
  back: "Volver a combos",
  sku: "SKU",
  includes: "Qué incluye este combo",
  addToCart: "Añadir",
  description: "Descripción",
  unavailable: "No disponible",
  decreaseQuantity: "Disminuir cantidad",
  increaseQuantity: "Aumentar cantidad",
  formatComponentPackages: (packages: number, units: number) =>
    `${packages} paquetes de ${units} unidades`,
  formatComponentUnits: (count: number) => `${count} unidades`,
  formatComponentPackagesAndLoose: (
    packages: number,
    units: number,
    loose: number,
  ) => `${packages} paquetes de ${units} unidades + ${loose} sueltas`,
};

describe("PackDetailPage", () => {
  it("renderiza nombre, descripción y cantidad del componente", () => {
    render(
      <PackDetailPage
        pack={basePack}
        labels={labels}
        quantity={1}
        minQuantity={1}
        maxQuantity={5}
        purchasable
        onDecreaseQuantity={vi.fn()}
        onIncreaseQuantity={vi.fn()}
        onAddToCart={vi.fn()}
      />,
    );

    expect(screen.getByText("Chisitos")).toBeInTheDocument();
    expect(screen.getByText("Snack crocante de maíz.")).toBeInTheDocument();
    expect(screen.getByText("2 paquetes de 12 unidades")).toBeInTheDocument();
  });
});

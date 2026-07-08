import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { ProductDetailPage } from "./product-detail-page";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

const baseProduct: PublicProductDetail = {
  id: "11111111-1111-1111-1111-111111111111",
  sku: "SKU-00123",
  slug: "gomitas-arcoiris",
  name: "Gomitas Arcoíris",
  brand: "Haribo",
  categoryId: "22222222-2222-2222-2222-222222222222",
  categoryName: "Gomitas",
  imageUrl: "https://example.com/gomitas.png",
  finalPrice: 8.5,
  stockTotalBaseUnits: 48,
  stockDisplay: "12 paquetes · 48 unidades",
  itemsPerPackage: 4,
  description: "Gomitas suaves con sabores frutales.",
  productType: "package",
  packageLabel: "Paquete x4",
};

const defaultLabels = {
  back: "Volver al catálogo",
  sku: "SKU",
  category: "Categoría",
  stock: "Stock",
  addToCart: "Añadir",
  description: "Descripción",
  packageBadge: "Paquete x4",
  decreaseQuantity: "Disminuir cantidad",
  increaseQuantity: "Aumentar cantidad",
};

function renderProductDetail(overrides?: {
  onAddToCart?: () => void;
  quantity?: number;
  maxQuantity?: number;
  onDecreaseQuantity?: () => void;
  onIncreaseQuantity?: () => void;
}) {
  const onDecreaseQuantity = overrides?.onDecreaseQuantity ?? vi.fn();
  const onIncreaseQuantity = overrides?.onIncreaseQuantity ?? vi.fn();

  render(
    <ProductDetailPage
      product={baseProduct}
      labels={defaultLabels}
      quantity={overrides?.quantity ?? 1}
      maxQuantity={overrides?.maxQuantity ?? 12}
      onDecreaseQuantity={onDecreaseQuantity}
      onIncreaseQuantity={onIncreaseQuantity}
      onAddToCart={overrides?.onAddToCart ?? vi.fn()}
    />,
  );

  return { onDecreaseQuantity, onIncreaseQuantity };
}

describe("ProductDetailPage", () => {
  it("renderiza nombre, precio, chips y enlace de regreso", () => {
    renderProductDetail();

    expect(
      screen.getByRole("heading", { name: "Gomitas Arcoíris" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$8.50")).toBeInTheDocument();
    expect(screen.getByText("Haribo")).toBeInTheDocument();
    expect(screen.getByText("Gomitas")).toBeInTheDocument();
    expect(screen.getByText("Paquete x4")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /volver al catálogo/i }),
    ).toHaveAttribute("href", "/?tab=productos");
  });

  it("muestra el selector de cantidad y dispara incremento", () => {
    const { onIncreaseQuantity } = renderProductDetail({ quantity: 2 });

    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Aumentar cantidad" })[0]!,
    );
    expect(onIncreaseQuantity).toHaveBeenCalledTimes(1);
  });

  it("oculta el chip de marca cuando brand es null", () => {
    render(
      <ProductDetailPage
        product={{ ...baseProduct, brand: null }}
        labels={{ ...defaultLabels, packageBadge: null }}
        quantity={1}
        maxQuantity={12}
        onDecreaseQuantity={vi.fn()}
        onIncreaseQuantity={vi.fn()}
        onAddToCart={vi.fn()}
      />,
    );

    expect(screen.queryByText("Haribo")).not.toBeInTheDocument();
  });
});

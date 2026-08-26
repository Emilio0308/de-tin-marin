import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { ProductDetailPage } from "./product-detail-page";
import { resolveProductTypeLabel } from "./product-detail-page.helpers";

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
  packageLabel: null,
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
};

const suggestions = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    slug: "ositos",
    name: "Ositos de Goma Mix",
    imageUrl: "https://example.com/ositos.png",
    finalPrice: 6.9,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    slug: "paletas",
    name: "Paletas Artesanales",
    imageUrl: "https://example.com/paletas.png",
    finalPrice: 4.5,
  },
];

const defaultLabels = {
  back: "Volver al catálogo",
  dulces: "Dulces",
  sku: "SKU",
  category: "Categoría",
  quantity: "Cantidad",
  availability: "Disponibilidad",
  inStock: "En stock (12 paquetes · 48 unidades)",
  outOfStock: "Sin stock",
  addToCart: "Añadir al carrito",
  description: "Descripción",
  productTypeLabel: "Paquete x4 unid.",
  decreaseQuantity: "Disminuir cantidad",
  increaseQuantity: "Aumentar cantidad",
  relatedTitle: "También te encantará",
  relatedSubtitle: "Descubre más dulces seleccionados para ti",
  viewAll: "Ver todo",
  completeGiftTitle: "Completa tu regalo",
  whyTitle: "¿Por qué te encantará?",
  highlightArtisanal: "Artesanal",
  highlightFresh: "Fresco",
  highlightShipping: "Envío rápido",
  whyFruit: "Explosión Frutal",
  whyTexture: "Textura Suave",
  whyGift: "Ideal para Regalo",
  whyLove: "Hecho con Amor",
};

function renderProductDetail(overrides?: {
  onAddToCart?: () => void;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  purchasable?: boolean;
  onDecreaseQuantity?: () => void;
  onIncreaseQuantity?: () => void;
  product?: PublicProductDetail;
  labels?: Partial<typeof defaultLabels>;
  suggestions?: typeof suggestions;
}) {
  const onDecreaseQuantity = overrides?.onDecreaseQuantity ?? vi.fn();
  const onIncreaseQuantity = overrides?.onIncreaseQuantity ?? vi.fn();

  render(
    <ProductDetailPage
      product={overrides?.product ?? baseProduct}
      suggestions={overrides?.suggestions ?? suggestions}
      labels={{ ...defaultLabels, ...overrides?.labels }}
      quantity={overrides?.quantity ?? 10}
      minQuantity={overrides?.minQuantity ?? 10}
      maxQuantity={overrides?.maxQuantity ?? 12}
      purchasable={overrides?.purchasable ?? true}
      onDecreaseQuantity={onDecreaseQuantity}
      onIncreaseQuantity={onIncreaseQuantity}
      onAddToCart={overrides?.onAddToCart ?? vi.fn()}
    />,
  );

  return { onDecreaseQuantity, onIncreaseQuantity };
}

describe("resolveProductTypeLabel", () => {
  it("devuelve Unitario para productos unit", () => {
    expect(
      resolveProductTypeLabel(
        { productType: "unit", itemsPerPackage: 1, packageLabel: null },
        {
          productTypeUnit: "Unitario",
          packageUnits: (count) => `Paquete x${count} unid.`,
        },
      ),
    ).toBe("Unitario");
  });

  it("usa Paquete xN unid. para productos package", () => {
    expect(
      resolveProductTypeLabel(
        {
          productType: "package",
          itemsPerPackage: 4,
          packageLabel: "Caja",
        },
        {
          productTypeUnit: "Unitario",
          packageUnits: (count) => `Paquete x${count} unid.`,
        },
      ),
    ).toBe("Paquete x4 unid.");

    expect(
      resolveProductTypeLabel(
        {
          productType: "package",
          itemsPerPackage: 12,
          packageLabel: null,
        },
        {
          productTypeUnit: "Unitario",
          packageUnits: (count) => `Paquete x${count} unid.`,
        },
      ),
    ).toBe("Paquete x12 unid.");
  });
});

describe("ProductDetailPage", () => {
  it("renderiza nombre, precio, tipo y enlace de regreso", () => {
    renderProductDetail();

    expect(
      screen.getAllByRole("heading", { name: "Gomitas Arcoíris" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("S/8.50").length).toBeGreaterThan(0);
    expect(screen.getByText("Haribo")).toBeInTheDocument();
    expect(screen.getAllByText("Gomitas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paquete x4 unid.").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /volver al catálogo/i }),
    ).toHaveAttribute("href", "/?tab=productos");
  });

  it("muestra disponibilidad, highlights y sugerencias", () => {
    renderProductDetail();

    expect(screen.getAllByText("Disponibilidad").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("En stock (12 paquetes · 48 unidades)").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("SKU-00123")).toBeInTheDocument();
    expect(screen.getByText("Artesanal")).toBeInTheDocument();
    expect(screen.getByText("También te encantará")).toBeInTheDocument();
    expect(screen.getAllByText("Ositos de Goma Mix").length).toBeGreaterThan(0);
    expect(screen.getByText("Completa tu regalo")).toBeInTheDocument();
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
    renderProductDetail({
      product: { ...baseProduct, brand: null },
      labels: { productTypeLabel: "Unitario" },
    });

    expect(screen.queryByText("Haribo")).not.toBeInTheDocument();
    expect(screen.getAllByText("Unitario").length).toBeGreaterThan(0);
  });
});

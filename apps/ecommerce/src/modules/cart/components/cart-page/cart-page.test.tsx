import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StoredCartLine } from "../../repositories/cart.repository";
import { CartPage } from "./cart-page";
import type { CartPageLabels } from "./cart-page.types";

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

const defaultLabels: CartPageLabels = {
  title: "Tu carrito",
  empty: "Tu carrito está vacío.",
  continueShopping: "Seguir comprando",
  checkout: "Ir a checkout",
  remove: "Quitar",
  subtotal: "Subtotal",
  unitPriceSuffix: "/ ud.",
  decreaseQuantity: "Disminuir cantidad",
  increaseQuantity: "Aumentar cantidad",
  components: "dulces",
  stockTitle: "Stock limitado",
  stockChecking: "Verificando stock…",
  stockProduct: "Dulce",
  stockContainer: "Envase",
  bundleBadge: "Sorpresa",
};

const productLine: StoredCartLine = {
  cartLineId: "line-1",
  line: {
    type: "product",
    productId: "11111111-1111-1111-1111-111111111111",
    sku: "GOM-001",
    name: "Gomitas Ácidas",
    quantity: 2,
    unitPrice: 2.5,
    lineTotal: 5,
  },
};

const bundleLine: StoredCartLine = {
  cartLineId: "line-2",
  line: {
    type: "bundle",
    bundleId: "22222222-2222-2222-2222-222222222222",
    name: "Combo Cumpleaños Arcoíris",
    quantity: 10,
    lineTotal: 89.9,
    container: {
      containerId: "33333333-3333-3333-3333-333333333333",
      sku: "CAJA-M",
      name: "Caja mediana",
      unitPrice: 15,
    },
    components: [
      {
        productId: "44444444-4444-4444-4444-444444444444",
        productName: "Gomitas",
        sku: "GOM-001",
        quantityPerUnit: 1,
        totalQuantity: 10,
        unitPrice: 2.5,
      },
    ],
  },
};

const defaultBounds = {
  minQuantity: 1,
  maxQuantity: 100,
  purchasable: true,
};

describe("CartPage", () => {
  it("muestra estado vacío con enlace para seguir comprando", () => {
    render(
      <CartPage
        lines={[]}
        subtotal={0}
        labels={defaultLabels}
        stockWarning={false}
        isStockPending={false}
        stockMessages={[]}
        formatBundlePersons={(count) => `Para ${count} personas`}
        lineImageUrlByCartLineId={{}}
        productBoundsByCartLineId={{}}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tu carrito" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Seguir comprando" }),
    ).toHaveAttribute("href", "/?tab=productos");
  });

  it("renderiza líneas de producto y sorpresa con subtotal", () => {
    render(
      <CartPage
        lines={[productLine, bundleLine]}
        subtotal={94.9}
        labels={defaultLabels}
        stockWarning={false}
        isStockPending={false}
        stockMessages={[]}
        formatBundlePersons={(count) => `Para ${count} personas`}
        lineImageUrlByCartLineId={{
          "line-1": "https://example.com/gomitas.png",
          "line-2": "https://example.com/combo.png",
        }}
        productBoundsByCartLineId={{
          "line-1": defaultBounds,
        }}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Gomitas Ácidas")).toBeInTheDocument();
    expect(screen.getByText("Combo Cumpleaños Arcoíris")).toBeInTheDocument();
    expect(screen.getByText("Para 10 personas · 1 dulces")).toBeInTheDocument();
    expect(screen.getAllByText("S/94.90").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /ir a checkout/i }).length,
    ).toBeGreaterThan(0);
  });

  it("invoca onRemove al quitar una línea", () => {
    const onRemove = vi.fn();

    render(
      <CartPage
        lines={[productLine]}
        subtotal={5}
        labels={defaultLabels}
        stockWarning={false}
        isStockPending={false}
        stockMessages={[]}
        formatBundlePersons={(count) => `Para ${count} personas`}
        lineImageUrlByCartLineId={{}}
        productBoundsByCartLineId={{}}
        onUpdateQuantity={vi.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
    expect(onRemove).toHaveBeenCalledWith("line-1");
  });

  it("muestra skeleton de stock mientras verifica", () => {
    render(
      <CartPage
        lines={[productLine]}
        subtotal={5}
        labels={defaultLabels}
        stockWarning={false}
        isStockPending
        stockMessages={[]}
        formatBundlePersons={(count) => `Para ${count} personas`}
        lineImageUrlByCartLineId={{}}
        productBoundsByCartLineId={{}}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getAllByLabelText("Verificando stock…")).toHaveLength(2);
  });
});

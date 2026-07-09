import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderConfirmationPage } from "./order-confirmation-page";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

const baseOrder = {
  orderNumber: "TM-20250707-0001",
  status: "pending_payment",
  paymentStatus: "pending",
  subtotal: 10,
  shippingTotal: 8,
  total: 18,
  createdAt: "2025-07-07T12:00:00.000Z",
  fulfillment: {
    method: "delivery" as const,
    deliveryAddress: {
      recipientName: "Ana García",
      line1: "Av. Grau 123",
      district: "Piura",
      city: "Piura",
      province: "Piura",
      reference: null,
      phone: "999888777",
    },
    notes: null,
  },
  shoppingCart: {
    lines: [
      {
        type: "product" as const,
        productId: "00000000-0000-0000-0000-000000000001",
        sku: "SKU-1",
        name: "Gomita",
        quantity: 1,
        unitPrice: 10,
        lineTotal: 10,
      },
    ],
  },
};

const defaultLabels = {
  title: "¡Pedido registrado!",
  orderNumber: "Número de pedido: TM-20250707-0001",
  missingParams: "Faltan datos",
  loading: "Cargando…",
  lookupLink: "Consultar en Mis pedidos",
  continueShopping: "Seguir comprando",
  detail: {
    subtotal: "Subtotal",
    shipping: "Envío",
    total: "Total",
    linesTitle: "Tu pedido",
    status: "Estado",
    paymentStatus: "Pago",
    deliveryTitle: "Entrega",
    pickupTitle: "Recojo",
    bundleBadge: "Sorpresa",
    bundleComponents: "dulces",
    formatBundlePersons: (count: number) => `Para ${count} personas`,
    formatStatus: () => "Pendiente de pago",
    formatPaymentStatus: () => "Pendiente",
  },
  payment: {
    title: "Instrucciones de pago",
    yapeLabel: "Yape",
    transferLabel: "Transferencia bancaria",
    yape: "Yape al número 999 888 777 a nombre de De Tin Marín.",
    transfer:
      "Transferencia BCP — cuenta 191-12345678-0-12 (De Tin Marín SAC).",
    note: "Envía el voucher",
  },
};

describe("OrderConfirmationPage", () => {
  it("muestra instrucciones cuando hay pedido pendiente de pago", () => {
    render(
      <OrderConfirmationPage
        orderNumber="TM-20250707-0001"
        email="ana@example.com"
        order={baseOrder}
        isLoading={false}
        errorMessage={null}
        labels={defaultLabels}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Instrucciones de pago" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Yape")).toBeInTheDocument();
    expect(screen.getByText("Gomita")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Seguir comprando" }),
    ).toHaveAttribute("href", "/?tab=productos");
  });

  it("oculta instrucciones de pago si el pedido ya no está pendiente", () => {
    render(
      <OrderConfirmationPage
        orderNumber="TM-20250707-0001"
        email="ana@example.com"
        order={{ ...baseOrder, status: "paid", paymentStatus: "paid" }}
        isLoading={false}
        errorMessage={null}
        labels={defaultLabels}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: "Instrucciones de pago" }),
    ).not.toBeInTheDocument();
  });
});

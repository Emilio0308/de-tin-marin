import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import { GuestOrderDetailView } from "./guest-order-detail";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

const order: GuestOrderDetail = {
  orderNumber: "TM-20250707-0001",
  status: "pending_payment",
  paymentStatus: "pending",
  subtotal: 10,
  shippingTotal: 8,
  total: 18,
  createdAt: "2025-07-07T12:00:00.000Z",
  fulfillment: {
    method: "delivery",
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
        type: "product",
        productId: "00000000-0000-0000-0000-000000000001",
        sku: "SKU-1",
        name: "Gomita",
        packageQuantity: 2,
        unitQuantity: 0,
        packagePrice: 5,
        unitPrice: 5,
        lineTotal: 10,
      },
    ],
  },
};

const labels = {
  subtotal: "Subtotal",
  shipping: "Envío",
  total: "Total",
  linesTitle: "Tu pedido",
  status: "Estado",
  paymentStatus: "Pago",
  deliveryTitle: "Entrega",
  pickupTitle: "Recojo",
  pickupPointTitle: "Punto de recojo",
  courierTitle: "Envío por agencia",
  pickupInStoreNote: "Recojo en tienda",
  bundleBadge: "Sorpresa",
  packBadge: "Combo",
  bundleComponents: "dulces",
  packComponents: "productos",
  progressTitle: "Seguimiento del pedido",
  orderPlaced: "Pedido registrado",
  orderNumber: "Número de pedido",
  dateLabel: "Creado",
  statusCurrent: "Estado actual",
  paymentPendingHint: "Te avisaremos cuando confirmemos tu pago.",
  formatBundlePersons: (count: number) => `Para ${count} personas`,
  formatStatus: (status: string) => status,
  formatPaymentStatus: (paymentStatus: string) => paymentStatus,
};

describe("GuestOrderDetailView", () => {
  it("renderiza resumen de líneas y totales", () => {
    render(<GuestOrderDetailView order={order} labels={labels} />);

    expect(screen.getByText("Gomita")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});

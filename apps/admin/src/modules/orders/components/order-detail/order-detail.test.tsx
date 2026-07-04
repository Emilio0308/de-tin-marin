import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderDetailView } from "./order-detail";
import type { OrderDetailLabels } from "./order-detail.types";
import type { OrderDetail } from "@de-tin-marin/validations/order";

const labels: OrderDetailLabels = {
  title: "Orden",
  back: "Volver",
  customer: "Cliente",
  delivery: "Entrega",
  cart: "Carrito",
  subtotal: "Subtotal",
  discount: "Descuento",
  shipping: "Envío",
  total: "Total",
  paymentStatus: "Pago",
  paymentPanelTitle: "Pago manual",
  paymentReference: "Referencia",
  paymentNotes: "Notas",
  confirmPayment: "Confirmar pago",
  confirmingPayment: "Confirmando…",
  paymentHistory: "Historial",
  refundPayment: "Reembolsar",
  refundingPayment: "Reembolsando…",
  noPayments: "Sin pagos",
  shipmentPanelTitle: "Envío",
  shipmentStatus: "Estado",
  shipmentTracking: "Seguimiento",
  shipmentCarrier: "Transportista",
  shipmentNotes: "Notas envío",
  saveShipment: "Guardar",
  savingShipment: "Guardando…",
  statusActionsTitle: "Avanzar estado",
  cancelOrder: "Cancelar",
  cancelling: "Cancelando…",
  cancelConfirm: "¿Cancelar?",
  referencePrefix: "Ref",
  paymentReferencePlaceholder: "Yape…",
  statusLabels: { pending_payment: "Pendiente de pago" },
  paymentStatusLabels: { pending: "Pendiente" },
  shipmentStatusLabels: { pending: "Pendiente" },
};

const order: OrderDetail = {
  id: "00000000-0000-0000-0000-000000000001",
  orderId: "TM-20260703-0001",
  customer: {
    uid: null,
    name: "Ana",
    lastName: "López",
    phone: "999888777",
    email: "ana@test.com",
  },
  fulfillment: { method: "pickup" },
  shoppingCart: {
    lines: [
      {
        type: "product",
        productId: "00000000-0000-0000-0000-000000000002",
        sku: "SKU-1",
        name: "Gomitas",
        quantity: 2,
        unitPrice: 5,
        lineTotal: 10,
      },
    ],
  },
  status: "pending_payment",
  paymentStatus: "pending",
  paymentMethods: [],
  subtotal: 10,
  discountTotal: 0,
  shippingTotal: 0,
  total: 10,
  currencyCode: "PEN",
  metadata: {},
  createdAt: "2026-07-03T00:00:00.000Z",
  payments: [],
  shipment: null,
};

describe("OrderDetailView", () => {
  it("shows confirm payment for pending orders", () => {
    render(
      <OrderDetailView
        order={order}
        labels={labels}
        paymentReference=""
        paymentNotes=""
        onPaymentReferenceChange={vi.fn()}
        onPaymentNotesChange={vi.fn()}
        onConfirmPayment={vi.fn()}
        shipmentStatus="pending"
        shipmentTracking=""
        shipmentCarrier=""
        shipmentNotes=""
        onShipmentStatusChange={vi.fn()}
        onShipmentTrackingChange={vi.fn()}
        onShipmentCarrierChange={vi.fn()}
        onShipmentNotesChange={vi.fn()}
        nextStatuses={[]}
      />,
    );

    expect(screen.getByText("Confirmar pago")).toBeInTheDocument();
    expect(screen.getByText("TM-20260703-0001")).toBeInTheDocument();
  });
});

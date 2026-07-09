import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrderStatus } from "@de-tin-marin/shared/order-cart";
import { OrderDetailView } from "./order-detail";
import type { OrderDetailLabels } from "./order-detail.types";
import type { OrderDetail } from "@de-tin-marin/validations/order";

vi.mock("../order-location-map/order-location-map.dynamic", () => ({
  OrderLocationMap: ({
    mapPin,
    fulfillmentMethod,
  }: {
    mapPin: { lat: number; lng: number } | null;
    fulfillmentMethod: string;
  }) =>
    mapPin && fulfillmentMethod === "delivery" ? (
      <div data-testid="order-location-map">
        {mapPin.lat},{mapPin.lng}
      </div>
    ) : (
      <div data-testid="order-location-unavailable" />
    ),
}));

const labels: OrderDetailLabels = {
  title: "Orden",
  back: "Volver",
  customer: "Cliente",
  delivery: "Entrega",
  pickupMethod: "Recojo en tienda",
  deliveryMethod: "Delivery",
  mapTitle: "Ubicación de entrega",
  mapHint: "Ubicación seleccionada por el cliente",
  mapUnavailable: "No hay ubicación registrada.",
  summaryTitle: "Resumen",
  surpriseLine: "Sorpresa",
  formatQuantityLabel: (quantity) => `Cantidad: ${quantity}`,
  taxesIncluded: "Impuestos incluidos",
  stockWarningBanner: "Stock limitado",
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
  statusLabels: {
    pending_payment: "Pendiente de pago",
    paid: "Pagado",
    preparing: "Preparando",
    ready: "Listo",
  },
  paymentStatusLabels: { pending: "Pendiente" },
  shipmentStatusLabels: { pending: "Pendiente" },
  stepperLabels: {
    pending_payment: "Pendiente de pago",
    paid: "Pagado",
    preparing: "Preparando",
    ready: "Listo",
    delivered: "Entregado",
    completed: "Completado",
  },
  stockWarningTitle: "Stock insuficiente",
  formatStockWarningItem: ({ sku, required, available }) =>
    `${sku}: ${required} / ${available}`,
  insufficientStockError: "Stock insuficiente",
};

const baseOrder: OrderDetail = {
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

function renderDetail(
  order: OrderDetail,
  options?: {
    nextStatuses?: OrderStatus[];
    onTransitionStatus?: (status: OrderStatus) => void;
  },
) {
  return render(
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
      nextStatuses={options?.nextStatuses ?? []}
      onTransitionStatus={options?.onTransitionStatus}
    />,
  );
}

describe("OrderDetailView", () => {
  it("shows confirm payment for pending orders", () => {
    renderDetail(baseOrder);
    expect(screen.getByText("Confirmar pago")).toBeInTheDocument();
    expect(screen.getByText("TM-20260703-0001")).toBeInTheDocument();
  });

  it("does not render map for pickup orders", () => {
    renderDetail(baseOrder);
    expect(
      screen.getByTestId("order-location-unavailable"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("order-location-map")).not.toBeInTheDocument();
  });

  it("renders map when delivery has mapPin", () => {
    renderDetail({
      ...baseOrder,
      fulfillment: {
        method: "delivery",
        deliveryAddress: {
          recipientName: "Ana",
          line1: "Av. Grau 123",
          district: "Piura",
          city: "Piura",
          province: "Piura",
          reference: "Casa azul",
          phone: "999888777",
        },
      },
      metadata: { mapPin: { lat: -5.2, lng: -80.6 } },
    });

    expect(screen.getByTestId("order-location-map")).toHaveTextContent(
      "-5.2,-80.6",
    );
  });

  it("shows stepper and transition buttons for paid orders", () => {
    renderDetail(
      { ...baseOrder, status: "paid" },
      {
        nextStatuses: ["preparing"],
        onTransitionStatus: vi.fn(),
      },
    );

    expect(screen.getByText("Pendiente de pago")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Preparando" }),
    ).toBeInTheDocument();
  });
});

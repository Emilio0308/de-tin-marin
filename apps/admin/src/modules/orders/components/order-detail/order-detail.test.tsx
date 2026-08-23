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
  pickupPointMethod: "Punto de recojo",
  deliveryMethod: "Delivery",
  mapTitle: "Ubicación de entrega",
  mapHint: "Ubicación seleccionada por el cliente",
  mapUnavailable: "No hay ubicación registrada.",
  summaryTitle: "Resumen",
  surpriseLine: "Sorpresa",
  formatQuantityLabel: (quantity) => `Cantidad: ${quantity}`,
  formatProductDualQty: (packages, units) =>
    units > 0 ? `${packages} paq. + ${units} u.` : `${packages} paq.`,
  formatComponentsLabel: (count) => `Ver componentes (${count})`,
  componentSku: "SKU",
  componentName: "Nombre",
  componentPrice: "Precio",
  componentQuantity: "Cantidad",
  taxesIncluded: "Impuestos incluidos",
  stockWarningBanner: "Stock limitado",
  cart: "Carrito",
  subtotal: "Subtotal",
  discount: "Descuento",
  surcharge: "Recargo",
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
  shipmentRequiredHint: "Indica transportista y seguimiento",
  statusActionsTitle: "Avanzar estado",
  cancelOrder: "Cancelar",
  cancelling: "Cancelando…",
  cancelConfirm: "¿Cancelar?",
  cancelConfirmPaid: "¿Cancelar pagada?",
  referencePrefix: "Ref",
  paymentReferencePlaceholder: "Yape…",
  statusLabels: {
    pending_payment: "Pendiente de pago",
    paid: "Pagado",
    preparing: "Preparando",
    ready: "Listo",
    awaiting_pickup: "Listo para recojo",
    in_transit: "En camino",
    delivered: "Entregada",
    completed: "Completada",
    cancelled: "Cancelada",
  },
  paymentStatusLabels: { pending: "Pendiente" },
  shipmentStatusLabels: { pending: "Pendiente" },
  stepperLabels: {
    pending_payment: "Pendiente de pago",
    paid: "Pagado",
    preparing: "Preparando",
    ready: "Listo",
    awaiting_pickup: "Listo para recojo",
    in_transit: "En camino",
    delivered: "Entregado",
    completed: "Completado",
  },
  stockWarningTitle: "Stock insuficiente",
  stockWarningColName: "Nombre",
  stockWarningColSku: "SKU",
  stockWarningColRequired: "Items requeridos",
  stockWarningColAvailable: "Items disponibles",
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
        packageQuantity: 2,
        unitQuantity: 0,
        packagePrice: 5,
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
  surchargeTotal: 0,
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
    onCancel?: () => void;
    onConfirmPayment?: () => void;
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
      onConfirmPayment={options?.onConfirmPayment ?? vi.fn()}
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
      onCancel={options?.onCancel}
    />,
  );
}

describe("OrderDetailView", () => {
  it("shows confirm payment for pending orders", () => {
    renderDetail(baseOrder);
    expect(screen.getByText("Confirmar pago")).toBeInTheDocument();
    expect(screen.getByText("TM-20260703-0001")).toBeInTheDocument();
  });

  it("shows stock shortage as a table and disables confirm", () => {
    renderDetail(
      {
        ...baseOrder,
        stockCheck: {
          ok: false,
          shortages: [
            {
              kind: "product",
              id: "00000000-0000-0000-0000-000000000002",
              sku: "SKU-1",
              name: "Gomitas",
              required: 20,
              available: 5,
            },
          ],
        },
      },
      { onConfirmPayment: vi.fn() },
    );

    expect(
      screen.getByRole("alert", { name: "Stock insuficiente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Nombre" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "SKU" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Items requeridos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Items disponibles" }),
    ).toBeInTheDocument();
    const shortageRow = screen.getByRole("row", { name: /Gomitas/ });
    expect(shortageRow).toHaveTextContent("SKU-1");
    expect(shortageRow).toHaveTextContent("20");
    expect(shortageRow).toHaveTextContent("5");
    expect(
      screen.getByRole("button", { name: "Confirmar pago" }),
    ).toBeDisabled();
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

  it("shows surprise components in a collapsible list", () => {
    renderDetail({
      ...baseOrder,
      shoppingCart: {
        lines: [
          {
            type: "bundle",
            bundleId: "00000000-0000-0000-0000-000000000010",
            name: "Sorpresa mediana",
            quantity: 1,
            lineTotal: 25,
            components: [
              {
                productId: "00000000-0000-0000-0000-000000000011",
                productName: "Gomitas",
                sku: "GOM-01",
                quantityPerUnit: 2,
                totalQuantity: 2,
                unitPrice: 3.5,
              },
            ],
          },
        ],
      },
    });

    expect(screen.getByText("Ver componentes (1)")).toBeInTheDocument();
    expect(screen.getByText("GOM-01")).toBeInTheDocument();
    expect(screen.getByText("Gomitas")).toBeInTheDocument();
    expect(screen.getByText("S/ 3.50")).toBeInTheDocument();
    expect(screen.getByText("GOM-01").closest("li")?.textContent).toContain(
      "2",
    );
  });

  it("shows cancel for paid orders when onCancel is provided", () => {
    renderDetail(
      { ...baseOrder, status: "paid", paymentStatus: "confirmed" },
      { onCancel: vi.fn() },
    );
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
  });

  it("does not show shipment panel on paid orders", () => {
    renderDetail({
      ...baseOrder,
      status: "paid",
      paymentStatus: "confirmed",
      fulfillment: { method: "delivery" },
    });
    expect(
      screen.queryByRole("heading", { name: "Envío" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Transportista")).not.toBeInTheDocument();
  });

  it("requires shipment fields before in_transit transition", () => {
    const onTransitionStatus = vi.fn();
    renderDetail(
      {
        ...baseOrder,
        status: "ready",
        paymentStatus: "confirmed",
        fulfillment: { method: "delivery" },
      },
      {
        nextStatuses: ["in_transit"],
        onTransitionStatus,
      },
    );

    expect(
      screen.getByText("Indica transportista y seguimiento"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "En camino" })).toBeDisabled();
  });

  it("does not show refund action on confirmed payments", () => {
    renderDetail({
      ...baseOrder,
      status: "paid",
      paymentStatus: "confirmed",
      payments: [
        {
          id: "00000000-0000-0000-0000-000000000099",
          amount: 10,
          status: "confirmed",
          method: "internal",
          notes: "Yape",
          confirmedAt: "2026-07-03T01:00:00.000Z",
          confirmedBy: null,
        },
      ],
    });
    expect(screen.queryByText("Reembolsar")).not.toBeInTheDocument();
  });
});

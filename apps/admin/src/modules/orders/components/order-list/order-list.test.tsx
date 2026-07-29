import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderList } from "./order-list";
import type { OrderListLabels } from "./order-list.types";

const labels: OrderListLabels = {
  columns: {
    orderNumber: "Nº orden",
    customer: "Cliente",
    status: "Estado",
    payment: "Pago",
    total: "Total",
    lines: "Líneas",
    date: "Fecha",
    actions: "Acciones",
  },
  view: "Ver",
  empty: "No hay órdenes todavía.",
  statusLabels: { pending_payment: "Pendiente de pago", paid: "Pagado" },
  paymentStatusLabels: { pending: "Pendiente", confirmed: "Confirmado" },
  formatLines: (count) => `${count} líneas`,
};

const orders = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    orderNumber: "TM-20260703-0001",
    status: "pending_payment",
    paymentStatus: "pending",
    customerName: "Ana López",
    total: 42.5,
    lineCount: 3,
    createdAt: "2026-07-03T12:00:00.000Z",
  },
];

describe("OrderList", () => {
  it("renders empty state", () => {
    render(<OrderList orders={[]} labels={labels} />);
    expect(screen.getByText("No hay órdenes todavía.")).toBeInTheDocument();
  });

  it("renders order badges and detail link", () => {
    render(<OrderList orders={orders} labels={labels} />);
    expect(screen.getAllByText("TM-20260703-0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pendiente de pago").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ver").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Ver/i }).length,
    ).toBeGreaterThan(0);
  });
});

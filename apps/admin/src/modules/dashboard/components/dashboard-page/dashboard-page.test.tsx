import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./dashboard-page";
import type { DashboardPageProps } from "./dashboard-page.types";

const baseProps: DashboardPageProps = {
  labels: {
    welcome: "¡Bienvenido de nuevo!",
    subtitle: "Resumen del día.",
    periodDaily: "Diario",
    periodWeekly: "Semanal",
    periodMonthly: "Mensual",
    recentOrdersTitle: "Órdenes recientes",
    viewAllOrders: "Ver todo",
    columnOrderId: "Nº orden",
    columnCustomer: "Cliente",
    columnProduct: "Resumen",
    columnAmount: "Monto",
    columnStatus: "Estado",
    inventoryAlertsTitle: "Alertas de inventario",
    activityTitle: "Actividad",
    loadMoreActivity: "Cargar más",
    alertTitle: "Alerta",
    alertDescription: "Descripción de alerta.",
    alertPriority: "Prioridad alta",
    alertTag: "Campaña",
    quickAdd: "Añadir producto",
    emptyOrders: "Sin órdenes",
    emptyAlerts: "Sin alertas",
  },
  stats: [
    {
      id: "products",
      icon: "products",
      label: "Total productos",
      value: "10",
      hint: "10 en catálogo",
      tone: "primary",
    },
  ],
  recentOrders: [
    {
      id: "1",
      orderId: "#DM-1",
      customer: "Ana",
      lineSummary: "2 artículos • S/ 10.00",
      amount: "S/ 10.00",
      timeAgo: "Hace 5 min",
      statusLabel: "Nuevo",
      statusVariant: "default",
      href: "/orders/1",
    },
  ],
  alerts: [
    {
      id: "1",
      icon: "warning",
      message: "Quedan pocas unidades de Gomitas.",
      timeAgo: "",
    },
  ],
};

describe("DashboardPage", () => {
  it("renderiza encabezado, métricas y listas", () => {
    render(<DashboardPage {...baseProps} />);

    expect(screen.getByText("¡Bienvenido de nuevo!")).toBeInTheDocument();
    expect(screen.getByText("Total productos")).toBeInTheDocument();
    expect(screen.getAllByText("Ana").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Quedan pocas unidades de Gomitas."),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Añadir producto").length).toBeGreaterThan(
      0,
    );
  });

  it("muestra estados vacíos", () => {
    render(
      <DashboardPage
        {...baseProps}
        recentOrders={[]}
        alerts={[]}
        labels={{
          ...baseProps.labels,
          emptyOrders: "Sin órdenes",
          emptyAlerts: "Sin alertas",
        }}
      />,
    );

    expect(screen.getByText("Sin órdenes")).toBeInTheDocument();
    expect(screen.getByText("Sin alertas")).toBeInTheDocument();
  });
});

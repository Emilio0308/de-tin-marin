import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminFormPageHeader } from "./admin-form-page-header";

describe("AdminFormPageHeader", () => {
  it("renderiza enlace de volver, breadcrumb y título", () => {
    render(
      <AdminFormPageHeader
        backHref="/products"
        backLabel="Volver a productos"
        breadcrumbParent="Productos"
        breadcrumbCurrent="Nuevo producto"
        title="Crear nuevo producto"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Volver a productos" }),
    ).toHaveAttribute("href", "/products");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Crear nuevo producto",
    );
    expect(screen.getByText("Nuevo producto")).toBeInTheDocument();
  });

  it("renderiza subtítulo cuando se proporciona", () => {
    render(
      <AdminFormPageHeader
        backHref="/orders"
        backLabel="Volver a órdenes"
        breadcrumbParent="Órdenes"
        breadcrumbCurrent="Nueva orden"
        title="Nueva orden"
        subtitle="La orden se creará en Pendiente de pago"
      />,
    );

    expect(
      screen.getByText("La orden se creará en Pendiente de pago"),
    ).toBeInTheDocument();
  });
});

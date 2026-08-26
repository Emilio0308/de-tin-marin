import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminCatalogStatusToggle } from "./admin-catalog-status-toggle";

describe("AdminCatalogStatusToggle", () => {
  it("muestra etiqueta activa y permite alternar", () => {
    const onToggle = vi.fn();

    render(
      <AdminCatalogStatusToggle
        active
        onToggle={onToggle}
        activeLabel="Activo"
        inactiveLabel="Borrador"
        ariaActivate="Activar sorpresa"
        ariaDeactivate="Desactivar sorpresa"
      />,
    );

    const toggle = screen.getByRole("switch", {
      name: "Desactivar sorpresa",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Activo")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("muestra etiqueta inactiva cuando no está activo", () => {
    render(
      <AdminCatalogStatusToggle
        active={false}
        onToggle={vi.fn()}
        activeLabel="Activo"
        inactiveLabel="Borrador"
        ariaActivate="Activar combo"
        ariaDeactivate="Desactivar combo"
      />,
    );

    expect(
      screen.getByRole("switch", { name: "Activar combo" }),
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CatalogExportPanel } from "./catalog-export-panel";
import { defaultSelectedSections } from "./catalog-export-panel.helpers";
import type { CatalogExportPanelProps } from "./catalog-export-panel.types";

const baseProps: CatalogExportPanelProps = {
  title: "Exportar estado",
  description: "Elige secciones.",
  downloadLabel: "Descargar Excel",
  downloadingLabel: "Generando…",
  emptySelectionLabel: "Selecciona al menos una sección.",
  errorLabel: "No se pudo generar el Excel.",
  sections: [
    { id: "products", label: "Productos" },
    { id: "bundles", label: "Sorpresas" },
    { id: "packs", label: "Packs" },
    { id: "containers", label: "Envases" },
    { id: "orders", label: "Órdenes" },
  ],
  selected: defaultSelectedSections(),
  downloading: false,
  error: null,
  onToggle: vi.fn(),
  onDownload: vi.fn(),
};

describe("CatalogExportPanel", () => {
  it("renderiza checkboxes y botón de descarga", () => {
    render(<CatalogExportPanel {...baseProps} />);

    expect(
      screen.getByRole("heading", { name: "Exportar estado" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Productos")).toBeInTheDocument();
    expect(screen.getByLabelText("Sorpresas")).toBeInTheDocument();
    expect(screen.getByLabelText("Packs")).toBeInTheDocument();
    expect(screen.getByLabelText("Envases")).toBeInTheDocument();
    expect(screen.getByLabelText("Órdenes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Descargar Excel/i }),
    ).toBeEnabled();
  });

  it("deshabilita descarga sin selección", () => {
    render(
      <CatalogExportPanel
        {...baseProps}
        selected={{
          products: false,
          bundles: false,
          packs: false,
          containers: false,
          orders: false,
        }}
      />,
    );

    expect(
      screen.getByText("Selecciona al menos una sección."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Descargar Excel/i }),
    ).toBeDisabled();
  });

  it("llama onToggle al marcar checkbox", () => {
    const onToggle = vi.fn();
    render(<CatalogExportPanel {...baseProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByLabelText("Productos"));
    expect(onToggle).toHaveBeenCalledWith("products");
  });

  it("bloquea el botón y muestra spinner mientras genera", () => {
    render(<CatalogExportPanel {...baseProps} downloading />);

    const button = screen.getByRole("button", { name: /Generando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Productos")).toBeDisabled();
  });
});

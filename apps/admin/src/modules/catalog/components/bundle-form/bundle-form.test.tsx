import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BundleForm } from "./bundle-form";
import type { BundleFormLabels } from "./bundle-form.types";

const products = [
  { id: "p1", name: "Galleta", unitNetPrice: 1 },
  { id: "p2", name: "Chocolate", unitNetPrice: 2 },
];

const containers = [
  { id: "c1", name: "Caja mediana", sku: "ENV-1-5", netPrice: 1.5 },
];

const labels: BundleFormLabels = {
  breadcrumbParent: "Sorpresas",
  breadcrumbCurrent: "Nueva sorpresa",
  title: "Crear nueva sorpresa",
  sectionGeneral: "Información general",
  sectionImage: "Imagen de portada",
  sectionComposition: "Composición",
  sectionConfig: "Configuración",
  name: "Nombre de la sorpresa",
  namePlaceholder: "Nombre",
  description: "Descripción",
  descriptionPlaceholder: "Descripción",
  imageUrl: "URL de la imagen",
  imageUrlPlaceholder: "https://…",
  imageAlt: "Vista previa",
  imageEmptyTitle: "Agrega una foto",
  imageEmptyHint: "Pega una URL",
  productSelectPlaceholder: "Selecciona un producto",
  addProduct: "Agregar",
  emptyItems: "Agrega al menos un producto.",
  decreaseUnits: "Disminuir unidades",
  increaseUnits: "Aumentar unidades",
  removeProduct: "Quitar",
  configActiveTitle: "¿Sorpresa activa?",
  configActiveHint: "Disponible",
  container: "Envase de sorpresa",
  containerPlaceholder: "Selecciona un envase",
  persons: "Cantidad de personas",
  subtotalLabel: "Subtotal",
  containerLabel: "Subtotal envases",
  totalLabel: "Inversión total estimada",
  cancel: "Cancelar",
  save: "Guardar sorpresa",
  saving: "Guardando…",
  formatCompositionCount: (count) => `${count} ítems`,
  formatUnitPrice: (price) => `${price} c/u`,
};

describe("BundleForm", () => {
  it("actualiza el total al agregar y quitar productos", () => {
    render(
      <BundleForm
        products={products}
        containers={containers}
        labels={labels}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(labels.container), {
      target: { value: "c1" },
    });
    fireEvent.change(screen.getByLabelText(labels.persons), {
      target: { value: "20" },
    });

    const productSelect = screen.getByRole("combobox", {
      name: labels.productSelectPlaceholder,
    });
    fireEvent.change(productSelect, { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: labels.addProduct }));

    fireEvent.change(productSelect, { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("button", { name: labels.addProduct }));

    expect(screen.getAllByText("S/ 90.00").length).toBeGreaterThan(0);

    const removeButtons = screen.getAllByRole("button", {
      name: labels.removeProduct,
    });
    fireEvent.click(removeButtons[0]!);

    expect(screen.getAllByText("S/ 70.00").length).toBeGreaterThan(0);
  });
});

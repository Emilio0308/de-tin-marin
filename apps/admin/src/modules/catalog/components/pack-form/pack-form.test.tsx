import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PackForm } from "./pack-form";
import type { PackFormLabels } from "./pack-form.types";

const products = [
  { id: "p1", name: "Galleta", packageNetPrice: 10 },
  { id: "p2", name: "Chocolate", packageNetPrice: 5 },
];

const campaigns: never[] = [];

const labels: PackFormLabels = {
  breadcrumbParent: "Combos",
  breadcrumbCurrent: "Nuevo combo",
  title: "Crear combo",
  sectionGeneral: "General",
  sectionImage: "Imagen",
  sectionComposition: "Composición",
  sectionPricing: "Precios",
  sectionConfig: "Config",
  sku: "SKU",
  skuPlaceholder: "SKU",
  name: "Nombre",
  namePlaceholder: "Nombre",
  slug: "Slug",
  slugPlaceholder: "slug",
  description: "Descripción",
  descriptionPlaceholder: "Descripción",
  imageUrl: "URL",
  imageUrlPlaceholder: "https://…",
  imageAlt: "Vista previa",
  imageEmptyTitle: "Imagen",
  imageEmptyHint: "URL",
  productSelectPlaceholder: "Producto",
  addProduct: "Agregar",
  emptyItems: "Agrega productos",
  decreasePackages: "Menos",
  increasePackages: "Más",
  removeProduct: "Quitar",
  referencePrice: "Referencia",
  normalPrice: "Normal",
  finalPrice: "Final",
  campaign: "Campaña",
  campaignNone: "Sin campaña",
  purchaseMin: "Mín",
  purchaseMax: "Máx",
  configActiveTitle: "Activo",
  configActiveHint: "Venta",
  cancel: "Cancelar",
  save: "Guardar",
  saving: "Guardando…",
  formatCompositionCount: (count) => `${count} ítems`,
  formatPackagePrice: (price) => `${price} / paq.`,
};

describe("PackForm", () => {
  it("actualiza la referencia al agregar productos con cantidades", () => {
    render(
      <PackForm
        products={products}
        campaigns={campaigns}
        labels={labels}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(labels.sku), {
      target: { value: "COMBO-1" },
    });
    fireEvent.change(screen.getByLabelText(labels.name), {
      target: { value: "Combo dulce" },
    });
    fireEvent.change(screen.getByLabelText(labels.normalPrice), {
      target: { value: "20" },
    });

    const productSelect = screen.getByRole("combobox", {
      name: labels.productSelectPlaceholder,
    });
    fireEvent.change(productSelect, { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: labels.addProduct }));

    expect(screen.getByLabelText(labels.referencePrice)).toHaveValue(
      "S/ 10.00",
    );

    fireEvent.change(productSelect, { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("button", { name: labels.addProduct }));

    expect(screen.getByLabelText(labels.referencePrice)).toHaveValue(
      "S/ 15.00",
    );
  });
});

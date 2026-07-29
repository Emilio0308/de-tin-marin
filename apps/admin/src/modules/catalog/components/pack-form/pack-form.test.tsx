import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PackForm } from "./pack-form";
import {
  isAllowedCatalogImageFile,
  resolvePackImageUrlForPersist,
} from "./pack-form.helpers";
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
  imageUpload: "Subir imagen",
  imageUploading: "Subiendo…",
  imageClear: "Quitar imagen",
  imageAlt: "Vista previa",
  imageEmptyTitle: "Sin foto aún",
  imageEmptyHint: "JPEG, PNG o WebP",
  imageFileInvalid: "Archivo inválido",
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
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      configurable: true,
      value: vi.fn(() => "blob:http://localhost/mock-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  });

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

  it("muestra preview cuando hay imageUrl inicial y permite quitarla", () => {
    render(
      <PackForm
        initial={{
          id: "pack-1",
          sku: "COMBO-1",
          name: "Combo",
          description: null,
          slug: "combo",
          imageUrl: "https://cdn.example.com/packs/a.webp",
          referenceNetPrice: 10,
          normalNetPrice: 12,
          finalPrice: 12,
          campaignId: null,
          purchaseMinQuantity: 1,
          purchaseMaxQuantity: 10,
          isActive: true,
          items: [
            {
              productId: "p1",
              productName: "Galleta",
              packageNetPrice: 10,
              packageQuantity: 1,
            },
          ],
        }}
        products={products}
        campaigns={campaigns}
        labels={labels}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    expect(screen.getByAltText(labels.imageAlt)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: labels.imageClear }));
    expect(screen.getByText(labels.imageEmptyTitle)).toBeInTheDocument();
  });

  it("muestra empty state de imagen sin URL", () => {
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

    expect(screen.getByText(labels.imageEmptyTitle)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.imageUpload)).toBeInTheDocument();
  });

  it("al elegir archivo válido llama onSubmit con pendingImage al guardar", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PackForm
        products={products}
        campaigns={campaigns}
        labels={labels}
        onSubmit={onSubmit}
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

    const file = new File(["x"], "combo.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(labels.imageUpload), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: labels.save }));

    expect(onSubmit).toHaveBeenCalled();
    const [, pending] = onSubmit.mock.calls[0] as [unknown, File | null];
    expect(pending).toBeInstanceOf(File);
    expect(pending?.name).toBe("combo.webp");
  });
});

describe("pack-form.helpers media", () => {
  it("acepta jpeg/png/webp dentro del límite", () => {
    expect(
      isAllowedCatalogImageFile(
        new File(["a"], "a.jpg", { type: "image/jpeg" }),
      ),
    ).toBe(true);
    expect(
      isAllowedCatalogImageFile(
        new File(["a"], "a.gif", { type: "image/gif" }),
      ),
    ).toBe(false);
  });

  it("resuelve URL persistida: pending gana; blob no se guarda", () => {
    const file = new File(["a"], "a.webp", { type: "image/webp" });
    expect(
      resolvePackImageUrlForPersist(
        "blob:http://local/1",
        file,
        "https://cdn.example.com/packs/x.webp",
      ),
    ).toBe("https://cdn.example.com/packs/x.webp");
    expect(
      resolvePackImageUrlForPersist("blob:http://local/1", null, null),
    ).toBeNull();
    expect(
      resolvePackImageUrlForPersist(
        "https://cdn.example.com/packs/old.webp",
        null,
        null,
      ),
    ).toBe("https://cdn.example.com/packs/old.webp");
  });
});

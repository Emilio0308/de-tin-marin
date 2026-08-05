import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BundleForm } from "./bundle-form";
import {
  isAllowedCatalogImageFile,
  resolveBundleImageUrlForPersist,
} from "./bundle-form.helpers";
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
  imageUpload: "Subir imagen",
  imageUploading: "Subiendo…",
  imageClear: "Quitar imagen",
  imageAlt: "Vista previa",
  imageEmptyTitle: "Sin foto aún",
  imageEmptyHint: "JPEG, PNG o WebP",
  imageFileInvalid: "Archivo inválido",
  productSelectPlaceholder: "Selecciona un producto",
  includeInactiveProducts: "Incluir inactivos",
  includeInactiveProductsHint: "Muestra productos desactivados",
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

  it("actualiza el total al agregar y quitar productos", () => {
    render(
      <BundleForm
        products={products}
        containers={containers}
        labels={labels}
        includeInactiveProducts={false}
        onIncludeInactiveProductsChange={vi.fn()}
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

  it("muestra preview cuando hay imageUrl inicial y permite quitarla", () => {
    render(
      <BundleForm
        initial={{
          id: "b1",
          name: "Sorpresa",
          description: null,
          imageUrl: "https://cdn.example.com/bundles/a.webp",
          containerId: "c1",
          containerName: "Caja mediana",
          containerNetPrice: 1.5,
          quantity: 1,
          isActive: true,
          items: [
            {
              productId: "p1",
              productName: "Galleta",
              unitNetPrice: 1,
              unitsPerPerson: 1,
            },
          ],
          itemsSubtotal: 1,
          containerSubtotal: 1.5,
          total: 2.5,
        }}
        products={products}
        containers={containers}
        labels={labels}
        includeInactiveProducts={false}
        onIncludeInactiveProductsChange={vi.fn()}
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

  it("al elegir archivo válido llama onSubmit con pendingImage al guardar", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <BundleForm
        products={products}
        containers={containers}
        labels={labels}
        includeInactiveProducts={false}
        onIncludeInactiveProductsChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(labels.name), {
      target: { value: "Sorpresa dulce" },
    });
    fireEvent.change(screen.getByLabelText(labels.container), {
      target: { value: "c1" },
    });
    const productSelect = screen.getByRole("combobox", {
      name: labels.productSelectPlaceholder,
    });
    fireEvent.change(productSelect, { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: labels.addProduct }));

    const file = new File(["x"], "bundle.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(labels.imageUpload), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: labels.save }));

    expect(onSubmit).toHaveBeenCalled();
    const [, pending] = onSubmit.mock.calls[0] as [unknown, File | null];
    expect(pending).toBeInstanceOf(File);
    expect(pending?.name).toBe("bundle.webp");
  });
});

describe("bundle-form.helpers media", () => {
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
      resolveBundleImageUrlForPersist(
        "blob:http://local/1",
        file,
        "https://cdn.example.com/bundles/x.webp",
      ),
    ).toBe("https://cdn.example.com/bundles/x.webp");
    expect(
      resolveBundleImageUrlForPersist("blob:http://local/1", null, null),
    ).toBeNull();
    expect(
      resolveBundleImageUrlForPersist(
        "https://cdn.example.com/bundles/old.webp",
        null,
        null,
      ),
    ).toBe("https://cdn.example.com/bundles/old.webp");
  });
});

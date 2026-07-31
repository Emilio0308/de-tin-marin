import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductForm } from "./product-form";
import { resolveProductImageUrlForPersist } from "./product-form.helpers";
import type { ProductFormLabels } from "./product-form.types";

const labels: ProductFormLabels = {
  breadcrumbParent: "Productos",
  breadcrumbCurrent: "Nuevo",
  title: "Nuevo producto",
  status: "Estado",
  statusActive: "Activo",
  statusInactive: "Inactivo",
  statusToggle: "Activar producto",
  sku: "SKU",
  skuPlaceholder: "SKU-001",
  name: "Nombre",
  namePlaceholder: "Nombre",
  slug: "Slug",
  slugPrefix: "/p/",
  slugPlaceholder: "slug",
  image: "Imagen",
  imagePreview: "Vista previa",
  imageAlt: "Vista previa del producto",
  imageUpload: "Subir imagen",
  imageUploading: "Subiendo…",
  imageClear: "Quitar imagen",
  imageEmptyHint: "JPEG, PNG o WebP",
  imageFileInvalid: "Archivo inválido",
  brand: "Marca",
  brandPlaceholder: "Marca",
  category: "Categoría",
  categoryPlaceholder: "Selecciona",
  productType: "Tipo",
  productTypeUnit: "Unidad",
  productTypePackage: "Paquete",
  productTypeHint: "Hint tipo",
  packageSection: "Paquete",
  itemsPerPackage: "Items",
  packageLabel: "Etiqueta",
  packageLabelPlaceholder: "Caja",
  packagePrice: "Precio paquete",
  unitPrice: "Precio unidad",
  unitPricePreview: "Preview",
  costNetPrice: "Costo de venta",
  costNetPriceHint: "Costo opcional",
  margin: "Margen",
  marginPct: "Margen %",
  marginEmpty: "—",
  formatMargin: (amount) => `S/ ${amount}`,
  formatMarginPct: (pct) => `${pct}%`,
  stock: "Stock",
  stockSealed: "Sellados",
  stockLoose: "Sueltos",
  stockUnitsOnly: "Unidades",
  stockDecrease: "Menos",
  stockIncrease: "Más",
  purchaseLimits: "Límites",
  purchaseMinQuantity: "Mín",
  purchaseMaxQuantity: "Máx",
  purchaseLimitsHint: "Hint límites",
  description: "Descripción",
  descriptionPlaceholder: "Desc",
  tipTitle: "Tip",
  tipBody: "Tip body",
  cancel: "Cancelar",
  save: "Guardar",
  saving: "Guardando…",
  formatUnitPrice: (price) => `$${price}`,
  formatStockTotal: (total) => `${total}`,
};

const categories = [
  {
    id: "cat-1",
    name: "Dulces",
    slug: "dulces",
    isActive: true,
    sortOrder: 0,
  },
];

describe("ProductForm", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      configurable: true,
      value: vi.fn(() => "blob:http://localhost/mock-product-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  });

  it("muestra empty state de imagen sin URL", () => {
    render(
      <ProductForm
        categories={categories}
        labels={labels}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    expect(screen.getByText(labels.imageEmptyHint)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.imageUpload)).toBeInTheDocument();
  });

  it("muestra preview cuando hay imageUrl inicial y permite quitarla", () => {
    render(
      <ProductForm
        initial={{
          id: "prod-1",
          sku: "SKU-1",
          name: "Gomitas",
          description: null,
          slug: "gomitas",
          brand: null,
          productType: "unit",
          itemsPerPackage: 1,
          packageLabel: null,
          packageNetPrice: 10,
          unitNetPrice: 10,
          costNetPrice: null,
          stockSealedPackages: 0,
          stockLooseBaseUnits: 5,
          stockTotalBaseUnits: 5,
          purchaseMinQuantity: 1,
          purchaseMaxQuantity: 100,
          categoryId: "cat-1",
          imageUrl: "https://cdn.example.com/products/a.webp",
          isActive: true,
        }}
        categories={categories}
        labels={labels}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    expect(screen.getByAltText(labels.imageAlt)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: labels.imageClear }));
    expect(screen.getByText(labels.imageEmptyHint)).toBeInTheDocument();
  });

  it("al elegir archivo válido llama onSubmit con pendingImage al guardar", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        initial={{
          id: "prod-1",
          sku: "SKU-1",
          name: "Gomitas",
          description: null,
          slug: "gomitas",
          brand: null,
          productType: "unit",
          itemsPerPackage: 1,
          packageLabel: null,
          packageNetPrice: 10,
          unitNetPrice: 10,
          costNetPrice: 4,
          stockSealedPackages: 0,
          stockLooseBaseUnits: 5,
          stockTotalBaseUnits: 5,
          purchaseMinQuantity: 1,
          purchaseMaxQuantity: 100,
          categoryId: "cat-1",
          imageUrl: null,
          isActive: true,
        }}
        categories={categories}
        labels={labels}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    expect(screen.getByLabelText(labels.costNetPrice)).toHaveValue(4);
    expect(screen.getByText("S/ 6.00")).toBeInTheDocument();
    expect(screen.getByText("150.0%")).toBeInTheDocument();

    const file = new File(["x"], "gummy.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(labels.imageUpload), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: labels.save }));

    expect(onSubmit).toHaveBeenCalled();
    const [values, pending] = onSubmit.mock.calls[0] as [
      { costNetPrice: number | null },
      File | null,
    ];
    expect(values.costNetPrice).toBe(4);
    expect(pending).toBeInstanceOf(File);
    expect(pending?.name).toBe("gummy.webp");
  });
});

describe("resolveProductImageUrlForPersist", () => {
  it("resuelve URL persistida: pending gana; blob no se guarda", () => {
    const file = new File(["a"], "a.webp", { type: "image/webp" });
    expect(
      resolveProductImageUrlForPersist(
        "blob:http://local/1",
        file,
        "https://cdn.example.com/products/x.webp",
      ),
    ).toBe("https://cdn.example.com/products/x.webp");
    expect(
      resolveProductImageUrlForPersist("blob:http://local/1", null, null),
    ).toBeNull();
    expect(
      resolveProductImageUrlForPersist(
        "https://cdn.example.com/products/old.webp",
        null,
        null,
      ),
    ).toBe("https://cdn.example.com/products/old.webp");
  });
});

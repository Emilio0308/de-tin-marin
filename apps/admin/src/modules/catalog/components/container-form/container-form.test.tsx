import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContainerForm } from "./container-form";
import { resolveContainerImageUrlForPersist } from "./container-form.helpers";
import type { ContainerFormLabels } from "./container-form.types";

const labels: ContainerFormLabels = {
  breadcrumbParent: "Envases",
  breadcrumbCurrent: "Nuevo",
  title: "Nuevo envase",
  sectionInfo: "Información",
  sectionImage: "Imagen",
  sectionFinance: "Finanzas",
  sectionConfig: "Configuración",
  sku: "SKU",
  skuRequired: "Requerido",
  skuPlaceholder: "ENV-001",
  name: "Nombre",
  nameRequired: "Requerido",
  namePlaceholder: "Caja",
  description: "Descripción",
  descriptionPlaceholder: "Desc",
  imageUpload: "Subir imagen",
  imageUploading: "Subiendo…",
  imageClear: "Quitar imagen",
  imageEmptyHint: "JPEG, PNG o WebP",
  imageFileInvalid: "Archivo inválido",
  imagePreview: "Vista previa del envase",
  imageAlt: "Vista previa del envase",
  netPrice: "Precio neto",
  netPriceRequired: "Requerido",
  stock: "Stock disponible",
  stockShort: "Stock",
  stockRequired: "Requerido",
  stockDecrease: "Disminuir stock",
  stockIncrease: "Aumentar stock",
  statusActiveTitle: "Estado activo",
  statusActiveHint: "Hint",
  statusYes: "Sí",
  statusNo: "No",
  tipTitle: "Tip",
  tipBody: "Tip body",
  previewLabel: "Vista previa",
  previewFallback: "Nombre del envase",
  cancel: "Cancelar",
  save: "Guardar envase",
  saving: "Guardando…",
};

describe("ContainerForm", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      configurable: true,
      value: vi.fn(() => "blob:http://localhost/mock-container-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  });

  it("muestra empty state de imagen sin URL", () => {
    render(
      <ContainerForm
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
      <ContainerForm
        initial={{
          id: "c1",
          sku: "ENV-1",
          name: "Caja kraft",
          description: null,
          imageUrl: "https://cdn.example.com/containers/a.webp",
          netPrice: 5,
          stockQuantity: 10,
          isActive: true,
        }}
        labels={labels}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    expect(screen.getAllByAltText(labels.imageAlt).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: labels.imageClear }));
    expect(screen.getByText(labels.imageEmptyHint)).toBeInTheDocument();
  });

  it("al elegir archivo válido llama onSubmit con pendingImage al guardar", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ContainerForm
        initial={{
          id: "c1",
          sku: "ENV-1",
          name: "Caja kraft",
          description: null,
          imageUrl: null,
          netPrice: 5,
          stockQuantity: 10,
          isActive: true,
        }}
        labels={labels}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    const file = new File(["x"], "box.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(labels.imageUpload), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: labels.save }));

    expect(onSubmit).toHaveBeenCalled();
    const [, pending] = onSubmit.mock.calls[0] as [unknown, File | null];
    expect(pending).toBeInstanceOf(File);
    expect(pending?.name).toBe("box.webp");
  });
});

describe("resolveContainerImageUrlForPersist", () => {
  it("resuelve URL persistida: pending gana; blob no se guarda", () => {
    const file = new File(["a"], "a.webp", { type: "image/webp" });
    expect(
      resolveContainerImageUrlForPersist(
        "blob:http://local/1",
        file,
        "https://cdn.example.com/containers/x.webp",
      ),
    ).toBe("https://cdn.example.com/containers/x.webp");
    expect(
      resolveContainerImageUrlForPersist("blob:http://local/1", null, null),
    ).toBeNull();
    expect(
      resolveContainerImageUrlForPersist(
        "https://cdn.example.com/containers/old.webp",
        null,
        null,
      ),
    ).toBe("https://cdn.example.com/containers/old.webp");
  });
});

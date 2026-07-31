import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebCustomizationPage } from "./web-customization-page";
import type { WebCustomizationPageProps } from "./web-customization-page.types";

const labels: WebCustomizationPageProps["labels"] = {
  title: "Personalización web",
  subtitle: "Configura el hero",
  loading: "Cargando…",
  loadError: "Error",
  sectionMode: "Modo de visualización",
  modeStatic: "Estático",
  modeCarousel: "Carrusel",
  modeHint: "Elige cómo se muestra",
  saveSettings: "Guardar configuración",
  savingSettings: "Guardando…",
  settingsSaved: "Guardado",
  sectionPreview: "Vista previa",
  previewEmpty: "Sin imágenes",
  previewPrev: "Anterior",
  previewNext: "Siguiente",
  sectionImages: "Imágenes del hero",
  addImage: "Agregar imagen",
  imageRequirements: "Cuadrada 1:1",
  altText: "Texto alternativo",
  altPlaceholder: "Opcional",
  startsAt: "Desde",
  endsAt: "Hasta",
  saveImage: "Guardar imagen",
  savingImage: "Guardando…",
  cancel: "Cancelar",
  delete: "Eliminar",
  moveUp: "Subir",
  moveDown: "Bajar",
  emptyImages: "Sin imágenes",
  columnsPreview: "Preview",
  columnsOrder: "Orden",
  columnsDates: "Fechas",
  columnsActions: "Acciones",
  deleteConfirm: "¿Eliminar?",
  infoTip: "Tip",
  pickImage: "Elegir imagen",
  changeImage: "Cambiar imagen",
  pickImageHint: "Elige una imagen",
};

const noop = () => undefined;

describe("WebCustomizationPage", () => {
  it("renderiza título y modos", () => {
    render(
      <WebCustomizationPage
        labels={labels}
        settings={{ displayMode: "static" }}
        images={[]}
        loading={false}
        loadError={null}
        settingsSubmitting={false}
        settingsMessage={null}
        settingsError={null}
        imageError={null}
        draft={null}
        imageSubmitting={false}
        canSaveDraft={false}
        onDisplayModeChange={noop}
        onSaveSettings={noop}
        onStartAdd={noop}
        onStartEdit={noop}
        onCancelDraft={noop}
        onDraftChange={noop}
        onPickFile={noop}
        onSaveDraft={noop}
        onDelete={noop}
        onMove={noop}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /personalización web/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /estático/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /carrusel/i }),
    ).toBeInTheDocument();
  });
});

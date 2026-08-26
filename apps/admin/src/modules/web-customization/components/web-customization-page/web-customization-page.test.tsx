import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WebCustomizationPage } from "./web-customization-page";
import type { WebCustomizationPageProps } from "./web-customization-page.types";

const labels: WebCustomizationPageProps["labels"] = {
  title: "Personalización web",
  subtitle: "Configura las imágenes de la tienda",
  tabListLabel: "Secciones de la tienda",
  tabHome: "Home",
  tabAbout: "Nosotros",
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
  aboutSection: "Página Nosotros",
  aboutRequirements: "Landscape 16:9",
  aboutInfoTip: "Tip nosotros",
  aboutPickHint: "Elige una imagen landscape",
  aboutPickImage: "Elegir imagen nosotros",
  aboutChangeImage: "Cambiar imagen nosotros",
  aboutSave: "Guardar imagen nosotros",
  aboutSaving: "Guardando nosotros…",
  aboutRestoreDefault: "Restaurar imagen por defecto",
  aboutUsingDefault: "Usando imagen por defecto",
  aboutPreviewAlt: "Vista previa Nosotros",
  aboutSaved: "Imagen guardada",
  aboutRestored: "Imagen restaurada",
};

const baseProps = {
  labels,
  settings: { displayMode: "static" as const },
  images: [],
  loading: false,
  loadError: null,
  settingsSubmitting: false,
  settingsMessage: null,
  settingsError: null,
  imageError: null,
  draft: null,
  imageSubmitting: false,
  canSaveDraft: false,
  aboutPreviewUrl: null,
  aboutSubmitting: false,
  aboutError: null,
  aboutMessage: null,
  canSaveAbout: false,
  canRestoreAbout: false,
};

const noop = () => undefined;

describe("WebCustomizationPage", () => {
  it("renderiza tabs y muestra Home por defecto", () => {
    render(
      <WebCustomizationPage
        {...baseProps}
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
        onAboutPickFile={noop}
        onSaveAbout={noop}
        onRestoreAbout={noop}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /personalización web/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("button", { name: /estático/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /restaurar imagen por defecto/i }),
    ).not.toBeInTheDocument();
  });

  it("cambia a la pestaña Nosotros", () => {
    render(
      <WebCustomizationPage
        {...baseProps}
        aboutPreviewUrl="https://cdn.example.com/about.jpg"
        canSaveAbout={true}
        canRestoreAbout={true}
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
        onAboutPickFile={noop}
        onSaveAbout={noop}
        onRestoreAbout={noop}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /nosotros/i }));

    expect(screen.getByRole("tab", { name: /nosotros/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("img", { name: /vista previa nosotros/i }),
    ).toHaveAttribute("src", "https://cdn.example.com/about.jpg");
    expect(
      screen.getByRole("button", { name: /guardar imagen nosotros/i }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /estático/i }),
    ).not.toBeInTheDocument();
  });
});

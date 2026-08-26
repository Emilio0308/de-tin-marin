import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StorefrontSettingsPage } from "./storefront-settings-page";
import type { StorefrontSettingsPageProps } from "./storefront-settings-page.types";

const labels: StorefrontSettingsPageProps["labels"] = {
  title: "Configuración de tienda",
  subtitle: "Reglas generales",
  loading: "Cargando…",
  loadError: "Error",
  sectionPromo: "Promo de envío",
  sectionMinOrder: "Pedido mínimo",
  sectionAnnouncement: "Aviso",
  freeDelivery: "Delivery gratis",
  freeDeliveryHint: "Piura",
  freePickupPoint: "Punto gratis",
  freePickupPointHint: "Mall",
  freeWindowStart: "Desde",
  freeWindowEnd: "Hasta",
  freeWindowHint: "Ventana",
  minOrderSubtotal: "Mínimo",
  minOrderHint: "0 = off",
  announcementEnabled: "Mostrar aviso",
  announcementEnabledHint: "Checkout",
  announcementMessage: "Mensaje",
  announcementMessageHint: "Texto",
  save: "Guardar",
  saving: "Guardando…",
  saved: "Guardado",
  infoTip: "Tip",
};

describe("StorefrontSettingsPage", () => {
  it("renderiza secciones y dispara guardado", () => {
    const onSave = vi.fn();
    const onChange = vi.fn();

    render(
      <StorefrontSettingsPage
        labels={labels}
        values={{
          freeDelivery: true,
          freePickupPoint: false,
          freeFulfillmentStartsAt: null,
          freeFulfillmentEndsAt: null,
          minOrderSubtotal: 50,
          announcementEnabled: true,
          announcementMessage: "Promo de agosto",
        }}
        loading={false}
        loadError={null}
        submitting={false}
        message={null}
        error={null}
        onChange={onChange}
        onSave={onSave}
      />,
    );

    expect(screen.getByText("Promo de envío")).toBeInTheDocument();
    expect(screen.getByText("Pedido mínimo")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensaje")).toHaveValue("Promo de agosto");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});

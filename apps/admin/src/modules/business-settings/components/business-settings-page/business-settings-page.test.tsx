import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusinessSettingsPage } from "./business-settings-page";
import type { BusinessSettingsPageProps } from "./business-settings-page.types";

const labels: BusinessSettingsPageProps["labels"] = {
  title: "Contacto y pagos",
  subtitle: "Datos públicos de la tienda",
  loading: "Cargando…",
  loadError: "Error de carga",
  sectionContact: "Contacto",
  sectionPayments: "Datos de pago",
  whatsappE164: "WhatsApp (E.164)",
  whatsappHint: "Sin +",
  email: "Correo",
  emailHint: "Público",
  yapePhone: "Yape",
  yapePhoneHint: "9 dígitos",
  yapeHolderName: "Titular Yape",
  bankName: "Banco",
  bankAccountHolderName: "Titular cuenta",
  bankAccountNumber: "Nº de cuenta",
  bankAccountNumberHint: "Cuenta",
  bankInterbankAccountNumber: "CCI",
  bankInterbankAccountNumberHint: "20 dígitos",
  save: "Guardar",
  saving: "Guardando…",
  saved: "Guardado",
  infoTip: "Tip",
};

describe("BusinessSettingsPage", () => {
  it("renderiza secciones y dispara guardado", () => {
    const onSave = vi.fn();
    const onChange = vi.fn();

    render(
      <BusinessSettingsPage
        labels={labels}
        values={{
          whatsappE164: "51980966238",
          email: "a@b.com",
          yapePhone: "999888777",
          yapeHolderName: "De Tin Marín",
          bankName: "BCP",
          bankAccountHolderName: "De Tin Marín SAC",
          bankAccountNumber: "191-12345678-0-12",
          bankInterbankAccountNumber: "00219100123456789012",
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

    expect(screen.getByText("Contacto")).toBeInTheDocument();
    expect(screen.getByText("Datos de pago")).toBeInTheDocument();
    expect(screen.getByLabelText("CCI")).toHaveValue("00219100123456789012");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});

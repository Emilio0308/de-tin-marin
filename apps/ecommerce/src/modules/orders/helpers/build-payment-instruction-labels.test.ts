import { describe, expect, it } from "vitest";
import {
  formatYapePhoneDisplay,
  type PublicBusinessSettings,
} from "@de-tin-marin/validations/business-settings";
import { buildPaymentInstructionLabels } from "./build-payment-instruction-labels";

const settings: PublicBusinessSettings = {
  whatsappE164: "51980966238",
  email: "detinmarindulcesyconfiteria@gmail.com",
  yapePhone: "999888777",
  yapeHolderName: "De Tin Marín",
  bankName: "BCP",
  bankAccountHolderName: "De Tin Marín SAC",
  bankAccountNumber: "191-12345678-0-12",
  bankInterbankAccountNumber: "00219100123456789012",
};

describe("buildPaymentInstructionLabels", () => {
  it("inyecta configuración de pago en los mensajes i18n", () => {
    const labels = buildPaymentInstructionLabels((key, values) => {
      if (key === "paymentInstructions.yape") {
        return `Yape al número ${values?.phone} a nombre de ${values?.holder}.`;
      }
      if (key === "paymentInstructions.transfer") {
        return `Transferencia ${values?.bank} — cuenta ${values?.account} · CCI ${values?.cci} (${values?.holder}).`;
      }
      return key;
    }, settings);

    expect(labels.yape).toContain(formatYapePhoneDisplay(settings.yapePhone));
    expect(labels.yape).toContain(settings.yapeHolderName);
    expect(labels.transfer).toContain(settings.bankAccountNumber);
    expect(labels.transfer).toContain(settings.bankInterbankAccountNumber);
    expect(labels.transfer).toContain(settings.bankAccountHolderName);
  });
});

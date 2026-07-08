import { describe, expect, it } from "vitest";
import { PAYMENT_INSTRUCTIONS } from "../constants/payment-instructions.constants";
import { buildPaymentInstructionLabels } from "./build-payment-instruction-labels";

describe("buildPaymentInstructionLabels", () => {
  it("inyecta constantes de pago en los mensajes i18n", () => {
    const labels = buildPaymentInstructionLabels((key, values) => {
      if (key === "paymentInstructions.yape") {
        return `Yape al número ${values?.phone} a nombre de ${values?.holder}.`;
      }
      if (key === "paymentInstructions.transfer") {
        return `Transferencia ${values?.bank} — cuenta ${values?.account} (${values?.holder}).`;
      }
      return key;
    });

    expect(labels.yape).toContain(PAYMENT_INSTRUCTIONS.yape.phoneDisplay);
    expect(labels.yape).toContain(PAYMENT_INSTRUCTIONS.yape.holderName);
    expect(labels.transfer).toContain(
      PAYMENT_INSTRUCTIONS.bankTransfer.accountNumber,
    );
    expect(labels.transfer).toContain(
      PAYMENT_INSTRUCTIONS.bankTransfer.holderName,
    );
  });
});

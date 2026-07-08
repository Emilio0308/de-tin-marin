import { PAYMENT_INSTRUCTIONS } from "../constants/payment-instructions.constants";
import type { PaymentInstructionsLabels } from "../components/guest-order-detail/guest-order-detail.types";

type PaymentInstructionTranslator = (
  key:
    | "paymentInstructions.title"
    | "paymentInstructions.yapeLabel"
    | "paymentInstructions.transferLabel"
    | "paymentInstructions.yape"
    | "paymentInstructions.transfer"
    | "paymentInstructions.note",
  values?: Record<string, string>,
) => string;

export function buildPaymentInstructionLabels(
  t: PaymentInstructionTranslator,
): PaymentInstructionsLabels {
  return {
    title: t("paymentInstructions.title"),
    yapeLabel: t("paymentInstructions.yapeLabel"),
    transferLabel: t("paymentInstructions.transferLabel"),
    yape: t("paymentInstructions.yape", {
      phone: PAYMENT_INSTRUCTIONS.yape.phoneDisplay,
      holder: PAYMENT_INSTRUCTIONS.yape.holderName,
    }),
    transfer: t("paymentInstructions.transfer", {
      bank: PAYMENT_INSTRUCTIONS.bankTransfer.bankName,
      account: PAYMENT_INSTRUCTIONS.bankTransfer.accountNumber,
      holder: PAYMENT_INSTRUCTIONS.bankTransfer.holderName,
    }),
    note: t("paymentInstructions.note"),
  };
}

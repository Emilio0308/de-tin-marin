import {
  formatYapePhoneDisplay,
  type PublicBusinessSettings,
} from "@de-tin-marin/validations/business-settings";
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
  settings: PublicBusinessSettings,
): PaymentInstructionsLabels {
  return {
    title: t("paymentInstructions.title"),
    yapeLabel: t("paymentInstructions.yapeLabel"),
    transferLabel: t("paymentInstructions.transferLabel"),
    yape: t("paymentInstructions.yape", {
      phone: formatYapePhoneDisplay(settings.yapePhone),
      holder: settings.yapeHolderName,
    }),
    transfer: t("paymentInstructions.transfer", {
      bank: settings.bankName,
      account: settings.bankAccountNumber,
      cci: settings.bankInterbankAccountNumber,
      holder: settings.bankAccountHolderName,
    }),
    note: t("paymentInstructions.note"),
  };
}

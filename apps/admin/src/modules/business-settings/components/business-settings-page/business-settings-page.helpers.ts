import type { BusinessSettingsDraft } from "./business-settings-page.types";

export const EMPTY_BUSINESS_SETTINGS_DRAFT: BusinessSettingsDraft = {
  whatsappE164: "",
  email: "",
  yapePhone: "",
  yapeHolderName: "",
  bankName: "",
  bankAccountHolderName: "",
  bankAccountNumber: "",
  bankInterbankAccountNumber: "",
};

export function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

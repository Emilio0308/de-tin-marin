import type { BusinessSettingsDTO } from "@/modules/business-settings/types/business-settings.dto";

export type BusinessSettingsDraft = BusinessSettingsDTO;

export type BusinessSettingsLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionContact: string;
  sectionPayments: string;
  whatsappE164: string;
  whatsappHint: string;
  email: string;
  emailHint: string;
  yapePhone: string;
  yapePhoneHint: string;
  yapeHolderName: string;
  bankName: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankAccountNumberHint: string;
  bankInterbankAccountNumber: string;
  bankInterbankAccountNumberHint: string;
  save: string;
  saving: string;
  saved: string;
  infoTip: string;
};

export type BusinessSettingsPageProps = {
  labels: BusinessSettingsLabels;
  values: BusinessSettingsDraft;
  loading: boolean;
  loadError: string | null;
  submitting: boolean;
  message: string | null;
  error: string | null;
  onChange: (patch: Partial<BusinessSettingsDraft>) => void;
  onSave: () => void;
};

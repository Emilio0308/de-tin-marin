import type { StorefrontSettingsDTO } from "@/modules/storefront-settings/types/storefront-settings.dto";

export type StorefrontSettingsDraft = StorefrontSettingsDTO;

export type StorefrontSettingsLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionPromo: string;
  sectionMinOrder: string;
  sectionAnnouncement: string;
  freeDelivery: string;
  freeDeliveryHint: string;
  freePickupPoint: string;
  freePickupPointHint: string;
  freeWindowStart: string;
  freeWindowEnd: string;
  freeWindowHint: string;
  minOrderSubtotal: string;
  minOrderHint: string;
  announcementEnabled: string;
  announcementEnabledHint: string;
  announcementMessage: string;
  announcementMessageHint: string;
  save: string;
  saving: string;
  saved: string;
  infoTip: string;
};

export type StorefrontSettingsPageProps = {
  labels: StorefrontSettingsLabels;
  values: StorefrontSettingsDraft;
  loading: boolean;
  loadError: string | null;
  submitting: boolean;
  message: string | null;
  error: string | null;
  onChange: (patch: Partial<StorefrontSettingsDraft>) => void;
  onSave: () => void;
};

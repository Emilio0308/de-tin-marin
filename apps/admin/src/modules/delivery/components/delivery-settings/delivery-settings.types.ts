import type {
  DeliverySettingsDTO,
  DeliveryZoneDTO,
} from "@/modules/delivery/types/delivery.dto";

export type DeliverySettingsValues = DeliverySettingsDTO;

export type ZoneDraft = {
  district: string;
  fee: number;
};

export type ZoneEditDraft = {
  id: string;
  district: string;
  fee: number;
  sortOrder: number;
  isActive: boolean;
};

export type DeliveryGlobalSettingsLabels = {
  sectionGlobal: string;
  pickupEnabled: string;
  pickupHint: string;
  pickupPointsEnabled: string;
  pickupPointsHint: string;
  deliveryEnabled: string;
  deliveryHint: string;
  courierEnabled: string;
  courierHint: string;
  fallbackFee: string;
  fallbackHint: string;
  saveSettings: string;
  savingSettings: string;
  loading: string;
  loadError: string;
};

export type DeliveryZonesLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionZones: string;
  district: string;
  districtPlaceholder: string;
  fee: string;
  feePlaceholder: string;
  addZone: string;
  addingZone: string;
  columns: {
    district: string;
    fee: string;
    status: string;
    order: string;
    actions: string;
  };
  statusActive: string;
  statusInactive: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  emptyZones: string;
  formatPrice: (amount: number) => string;
  formatOrder: (order: number) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (district: string) => string;
  formatAriaDelete: (district: string) => string;
  infoTip: string;
  deleteConfirm: string;
  errors: {
    validation: string;
    duplicateDistrict: string;
    default: string;
  };
};

/** @deprecated Prefer DeliveryZonesLabels / DeliveryGlobalSettingsLabels */
export type DeliverySettingsLabels = DeliveryZonesLabels &
  DeliveryGlobalSettingsLabels & {
    settingsSaved: string;
  };

export type DeliveryGlobalSettingsProps = {
  settings: DeliverySettingsValues;
  labels: DeliveryGlobalSettingsLabels;
  settingsSubmitting: boolean;
  settingsError: string | null;
  onSettingsChange: (values: DeliverySettingsValues) => void;
  onSaveSettings: () => void;
};

export type DeliverySettingsProps = {
  zones: DeliveryZoneDTO[];
  zoneDraft: ZoneDraft;
  editingZone: ZoneEditDraft | null;
  labels: DeliveryZonesLabels;
  zoneSubmitting: boolean;
  deletingZoneId: string | null;
  zoneError: string | null;
  onZoneDraftChange: (draft: ZoneDraft) => void;
  onAddZone: () => void;
  onStartEditZone: (zone: DeliveryZoneDTO) => void;
  onCancelEditZone: () => void;
  onEditZoneChange: (draft: ZoneEditDraft) => void;
  onSaveEditZone: () => void;
  onToggleZoneActive: (zone: DeliveryZoneDTO) => void;
  onDeleteZone: (id: string) => void;
};

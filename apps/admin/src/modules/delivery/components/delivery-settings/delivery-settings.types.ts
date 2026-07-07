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

export type DeliverySettingsLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionGlobal: string;
  pickupEnabled: string;
  pickupHint: string;
  deliveryEnabled: string;
  deliveryHint: string;
  fallbackFee: string;
  fallbackHint: string;
  saveSettings: string;
  savingSettings: string;
  settingsSaved: string;
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

export type DeliverySettingsProps = {
  settings: DeliverySettingsValues;
  zones: DeliveryZoneDTO[];
  zoneDraft: ZoneDraft;
  editingZone: ZoneEditDraft | null;
  labels: DeliverySettingsLabels;
  settingsSubmitting: boolean;
  zoneSubmitting: boolean;
  deletingZoneId: string | null;
  settingsError: string | null;
  zoneError: string | null;
  onSettingsChange: (values: DeliverySettingsValues) => void;
  onSaveSettings: () => void;
  onZoneDraftChange: (draft: ZoneDraft) => void;
  onAddZone: () => void;
  onStartEditZone: (zone: DeliveryZoneDTO) => void;
  onCancelEditZone: () => void;
  onEditZoneChange: (draft: ZoneEditDraft) => void;
  onSaveEditZone: () => void;
  onToggleZoneActive: (zone: DeliveryZoneDTO) => void;
  onDeleteZone: (id: string) => void;
};

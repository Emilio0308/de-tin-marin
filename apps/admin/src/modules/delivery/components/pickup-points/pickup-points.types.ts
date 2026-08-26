import type { PickupPointDTO } from "@/modules/delivery/types/delivery.dto";

export type PickupPointDraft = {
  name: string;
  lat: number;
  lng: number;
  fee: number;
};

export type PickupPointEditDraft = PickupPointDraft & {
  id: string;
  sortOrder: number;
  isActive: boolean;
};

export type PickupPointsLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionPoints: string;
  name: string;
  namePlaceholder: string;
  fee: string;
  feePlaceholder: string;
  mapHint: string;
  mapSearchLabel: string;
  mapSearchPlaceholder: string;
  mapSearchNoResults: string;
  addPoint: string;
  addingPoint: string;
  columns: {
    name: string;
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
  emptyPoints: string;
  formatPrice: (amount: string) => string;
  formatOrder: (order: number) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
  deleteConfirm: string;
  errors: {
    validation: string;
    duplicateName: string;
    default: string;
  };
};

export type PickupPointsProps = {
  points: PickupPointDTO[];
  pointDraft: PickupPointDraft;
  editingPoint: PickupPointEditDraft | null;
  isMapVisible: boolean;
  labels: PickupPointsLabels;
  pointSubmitting: boolean;
  deletingPointId: string | null;
  pointError: string | null;
  onPointDraftChange: (draft: PickupPointDraft) => void;
  onAddPoint: () => void;
  onStartEditPoint: (point: PickupPointDTO) => void;
  onCancelEditPoint: () => void;
  onEditPointChange: (draft: PickupPointEditDraft) => void;
  onSaveEditPoint: () => void;
  onTogglePointActive: (point: PickupPointDTO) => void;
  onDeletePoint: (id: string) => void;
  onMapPinChange: (pin: { lat: number; lng: number }) => void;
};

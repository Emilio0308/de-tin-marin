import type {
  HeroDisplayMode,
  HeroImageDTO,
  HeroSettingsDTO,
} from "@/modules/web-customization/types/hero.dto";

export type HeroImageDraft = {
  id: string | null;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  startsAtLocal: string;
  endsAtLocal: string;
  pendingFile: File | null;
  previewUrl: string | null;
};

export type WebCustomizationLabels = {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  sectionMode: string;
  modeStatic: string;
  modeCarousel: string;
  modeHint: string;
  saveSettings: string;
  savingSettings: string;
  settingsSaved: string;
  sectionPreview: string;
  previewEmpty: string;
  previewPrev: string;
  previewNext: string;
  sectionImages: string;
  addImage: string;
  imageRequirements: string;
  altText: string;
  altPlaceholder: string;
  startsAt: string;
  endsAt: string;
  saveImage: string;
  savingImage: string;
  cancel: string;
  delete: string;
  moveUp: string;
  moveDown: string;
  emptyImages: string;
  columnsPreview: string;
  columnsOrder: string;
  columnsDates: string;
  columnsActions: string;
  deleteConfirm: string;
  infoTip: string;
  pickImage: string;
  changeImage: string;
  pickImageHint: string;
};

export type WebCustomizationPageProps = {
  labels: WebCustomizationLabels;
  settings: HeroSettingsDTO;
  images: HeroImageDTO[];
  loading: boolean;
  loadError: string | null;
  settingsSubmitting: boolean;
  settingsMessage: string | null;
  settingsError: string | null;
  imageError: string | null;
  draft: HeroImageDraft | null;
  imageSubmitting: boolean;
  canSaveDraft: boolean;
  onDisplayModeChange: (mode: HeroDisplayMode) => void;
  onSaveSettings: () => void;
  onStartAdd: () => void;
  onStartEdit: (image: HeroImageDTO) => void;
  onCancelDraft: () => void;
  onDraftChange: (draft: HeroImageDraft) => void;
  onPickFile: (file: File | null) => void;
  onSaveDraft: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

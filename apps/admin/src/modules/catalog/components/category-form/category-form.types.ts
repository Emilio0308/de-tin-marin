import type { CategoryFormDTO } from "@/modules/catalog/types/category.dto";

export type CategoryFormValues = {
  name: string;
  description: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryFormLabels = {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
  title: string;
  sectionGeneral: string;
  sectionConfig: string;
  name: string;
  nameRequired: string;
  namePlaceholder: string;
  description: string;
  descriptionOptional: string;
  descriptionPlaceholder: string;
  descriptionMaxHint: string;
  slug: string;
  slugUnique: string;
  slugPrefix: string;
  slugPlaceholder: string;
  slugHint: string;
  sortOrder: string;
  sortOrderShort: string;
  sortOrderDecrease: string;
  sortOrderIncrease: string;
  status: string;
  statusYes: string;
  statusNo: string;
  statusActiveTitle: string;
  statusActiveHint: string;
  tipTitle: string;
  tipBody: string;
  previewLabel: string;
  previewFallback: string;
  cancel: string;
  save: string;
  saving: string;
  formatNameCounter: (current: number, max: number) => string;
  formatDescriptionCounter: (current: number, max: number) => string;
};

export type CategoryFormProps = {
  initial?: CategoryFormDTO;
  labels: CategoryFormLabels;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

export type CategoryFormContainerProps = {
  mode: "create" | "edit";
  initial?: CategoryFormDTO;
};

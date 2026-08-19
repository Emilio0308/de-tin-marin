import type { SurpriseContainerFormDTO } from "@/modules/catalog/types/surprise-container.dto";

export type ContainerFormValues = {
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  netPrice: number;
  stockQuantity: number;
  isActive: boolean;
};

export type ContainerImageUploadResult =
  { ok: true; publicUrl: string } | { ok: false; error: string };

export type ContainerFormLabels = {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
  back: string;
  title: string;
  sectionInfo: string;
  sectionImage: string;
  sectionFinance: string;
  sectionConfig: string;
  sku: string;
  skuRequired: string;
  skuPlaceholder: string;
  name: string;
  nameRequired: string;
  namePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  imageUpload: string;
  imageUploading: string;
  imageClear: string;
  imageEmptyHint: string;
  imageFileInvalid: string;
  imagePreview: string;
  imageAlt: string;
  netPrice: string;
  netPriceRequired: string;
  stock: string;
  stockShort: string;
  stockRequired: string;
  stockDecrease: string;
  stockIncrease: string;
  statusActiveTitle: string;
  statusActiveHint: string;
  statusYes: string;
  statusNo: string;
  tipTitle: string;
  tipBody: string;
  previewLabel: string;
  previewFallback: string;
  cancel: string;
  save: string;
  saving: string;
};

export type ContainerFormProps = {
  initial?: SurpriseContainerFormDTO;
  backHref: string;
  labels: ContainerFormLabels;
  onSubmit: (
    values: ContainerFormValues,
    pendingImage: File | null,
  ) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

export type ContainerFormContainerProps = {
  mode: "create" | "edit";
  initial?: SurpriseContainerFormDTO;
};

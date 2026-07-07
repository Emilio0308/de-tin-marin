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

export type ContainerFormLabels = {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
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
  imageUrl: string;
  imageUrlPlaceholder: string;
  imageVerify: string;
  imageInvalid: string;
  imagePreview: string;
  imagePreviewEmpty: string;
  imageHint: string;
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
  labels: ContainerFormLabels;
  onSubmit: (values: ContainerFormValues) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

export type ContainerFormContainerProps = {
  mode: "create" | "edit";
  initial?: SurpriseContainerFormDTO;
};

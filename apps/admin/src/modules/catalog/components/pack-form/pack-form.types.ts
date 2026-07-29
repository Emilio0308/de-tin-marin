import type { PackFormDTO } from "@/modules/catalog/types/pack.dto";

export type ProductOption = {
  id: string;
  name: string;
  packageNetPrice: number;
};

export type CampaignOption = {
  id: string;
  name: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type PackFormItemValues = {
  productId: string;
  packageQuantity: number;
};

export type PackFormValues = {
  sku: string;
  name: string;
  description: string;
  slug: string;
  imageUrl: string;
  normalNetPrice: number;
  campaignId: string;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
  isActive: boolean;
  items: PackFormItemValues[];
};

export type PackImageUploadResult =
  { ok: true; publicUrl: string } | { ok: false; error: string };

export type PackFormLabels = {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
  title: string;
  sectionGeneral: string;
  sectionImage: string;
  sectionComposition: string;
  sectionPricing: string;
  sectionConfig: string;
  sku: string;
  skuPlaceholder: string;
  name: string;
  namePlaceholder: string;
  slug: string;
  slugPlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  imageUpload: string;
  imageUploading: string;
  imageClear: string;
  imageAlt: string;
  imageEmptyTitle: string;
  imageEmptyHint: string;
  imageFileInvalid: string;
  productSelectPlaceholder: string;
  addProduct: string;
  emptyItems: string;
  decreasePackages: string;
  increasePackages: string;
  removeProduct: string;
  referencePrice: string;
  normalPrice: string;
  finalPrice: string;
  campaign: string;
  campaignNone: string;
  purchaseMin: string;
  purchaseMax: string;
  configActiveTitle: string;
  configActiveHint: string;
  cancel: string;
  save: string;
  saving: string;
  formatCompositionCount: (count: number) => string;
  formatPackagePrice: (price: string) => string;
};

export type PackFormProps = {
  initial?: PackFormDTO;
  products: ProductOption[];
  campaigns: CampaignOption[];
  labels: PackFormLabels;
  /** `pendingImage` is set only when the user picked a new file; upload happens in the container on save. */
  onSubmit: (
    values: PackFormValues,
    pendingImage: File | null,
  ) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

export type PackFormContainerProps = {
  mode: "create" | "edit";
  initial?: PackFormDTO;
};

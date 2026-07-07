import type { BundleFormDTO } from "@/modules/catalog/types/bundle.dto";

export type ProductOption = {
  id: string;
  name: string;
  unitNetPrice: number;
};

export type ContainerOption = {
  id: string;
  name: string;
  sku: string;
  netPrice: number;
};

export type BundleFormItemValues = {
  productId: string;
  unitsPerPerson: number;
};

export type BundleFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  containerId: string;
  quantity: number;
  isActive: boolean;
  items: BundleFormItemValues[];
};

export type BundleFormLabels = {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
  title: string;
  sectionGeneral: string;
  sectionImage: string;
  sectionComposition: string;
  sectionConfig: string;
  name: string;
  namePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  imageUrl: string;
  imageUrlPlaceholder: string;
  imageAlt: string;
  imageEmptyTitle: string;
  imageEmptyHint: string;
  productSelectPlaceholder: string;
  addProduct: string;
  emptyItems: string;
  decreaseUnits: string;
  increaseUnits: string;
  removeProduct: string;
  configActiveTitle: string;
  configActiveHint: string;
  container: string;
  containerPlaceholder: string;
  persons: string;
  subtotalLabel: string;
  containerLabel: string;
  totalLabel: string;
  cancel: string;
  save: string;
  saving: string;
  formatCompositionCount: (count: number) => string;
  formatUnitPrice: (price: string) => string;
};

export type BundleFormProps = {
  initial?: BundleFormDTO;
  products: ProductOption[];
  containers: ContainerOption[];
  labels: BundleFormLabels;
  onSubmit: (values: BundleFormValues) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

export type BundleFormContainerProps = {
  mode: "create" | "edit";
  initial?: BundleFormDTO;
};

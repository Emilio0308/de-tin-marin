import type { BundleFormDTO } from "@/modules/catalog/types/bundle.dto";

export type ProductOption = {
  id: string;
  name: string;
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
  serviceFee: number;
  quantity: number;
  isActive: boolean;
  items: BundleFormItemValues[];
};

export type BundleFormProps = {
  initial?: BundleFormDTO;
  products: ProductOption[];
  onSubmit: (values: BundleFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
};

export type BundleFormContainerProps = {
  mode: "create" | "edit";
  initial?: BundleFormDTO;
};

import type { BundleListItem } from "@de-tin-marin/validations/bundle";

export type BundleFormItemDTO = {
  productId: string;
  productName: string;
  unitNetPrice: number;
  unitsPerPerson: number;
};

export type BundleFormDTO = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  serviceFee: number;
  quantity: number;
  isActive: boolean;
  items: BundleFormItemDTO[];
  itemsSubtotal: number;
  total: number;
};

export type { BundleListItem };

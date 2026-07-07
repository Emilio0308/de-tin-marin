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
  containerId: string;
  containerName: string;
  containerNetPrice: number;
  quantity: number;
  isActive: boolean;
  items: BundleFormItemDTO[];
  itemsSubtotal: number;
  containerSubtotal: number;
  total: number;
};

export type { BundleListItem };

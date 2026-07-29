import type { PackListItem } from "@de-tin-marin/validations/pack";

export type PackFormItemDTO = {
  productId: string;
  productName: string;
  packageNetPrice: number;
  packageQuantity: number;
};

export type PackFormDTO = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  normalNetPrice: number;
  referenceNetPrice: number;
  finalPrice: number;
  campaignId: string | null;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
  isActive: boolean;
  items: PackFormItemDTO[];
};

export type { PackListItem };

export type SurpriseContainerListItem = {
  id: string;
  sku: string;
  name: string;
  netPrice: number;
  stockQuantity: number;
  isActive: boolean;
};

export type SurpriseContainerFormDTO = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  netPrice: number;
  stockQuantity: number;
  isActive: boolean;
};

export type SurpriseContainerOption = Pick<
  SurpriseContainerListItem,
  "id" | "name" | "netPrice" | "sku"
>;

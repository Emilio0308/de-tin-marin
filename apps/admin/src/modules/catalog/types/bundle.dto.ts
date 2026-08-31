import type { BundleListItem } from "@de-tin-marin/validations/bundle";

export type BundleFormItemDTO = {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  unitNetPrice: number;
  netPrice: number;
  unitsPerPerson: number;
  isActive: boolean;
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockTotalBaseUnits: number;
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
  customizationMinProducts: number;
  customizationMaxProducts: number;
  isActive: boolean;
  items: BundleFormItemDTO[];
  itemsSubtotal: number;
  containerSubtotal: number;
  /** Precio comercial normalizado (plantilla × quantity). */
  total: number;
  /** Precio crudo sin normalizar. */
  rawTotal: number;
  normalizedPerSurprisePrice: number;
};

export type { BundleListItem };

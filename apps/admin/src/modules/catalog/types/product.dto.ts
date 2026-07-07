import type { ProductListItem } from "@de-tin-marin/validations/product";

export type ProductFormDTO = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  slug: string;
  brand: string | null;
  productType: "unit" | "package";
  itemsPerPackage: number;
  packageLabel: string | null;
  packageNetPrice: number;
  unitNetPrice: number;
  stockSealedPackages: number;
  stockLooseBaseUnits: number;
  stockTotalBaseUnits: number;
  categoryId: string;
  imageUrl: string | null;
  isActive: boolean;
};

export type { ProductListItem };

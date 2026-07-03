import type { ProductFormDTO } from "@/modules/catalog/types/product.dto";
import type { CategoryListItem } from "@de-tin-marin/validations/category";

export type ProductFormValues = {
  sku: string;
  name: string;
  description: string;
  slug: string;
  brand: string;
  netPrice: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
};

export type ProductFormProps = {
  initial?: ProductFormDTO;
  categories: CategoryListItem[];
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
};

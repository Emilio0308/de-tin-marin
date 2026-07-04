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

export type ProductFormLabels = {
  breadcrumbParent: string;
  breadcrumbCurrent: string;
  title: string;
  status: string;
  statusActive: string;
  statusInactive: string;
  statusToggle: string;
  sku: string;
  skuPlaceholder: string;
  name: string;
  namePlaceholder: string;
  slug: string;
  slugPrefix: string;
  slugPlaceholder: string;
  image: string;
  imagePreview: string;
  imageAlt: string;
  imageUrl: string;
  imageUrlPlaceholder: string;
  brand: string;
  brandPlaceholder: string;
  category: string;
  categoryPlaceholder: string;
  price: string;
  stock: string;
  stockDecrease: string;
  stockIncrease: string;
  description: string;
  descriptionPlaceholder: string;
  tipTitle: string;
  tipBody: string;
  cancel: string;
  save: string;
  saving: string;
};

export type ProductFormProps = {
  initial?: ProductFormDTO;
  categories: CategoryListItem[];
  labels: ProductFormLabels;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

import type { CategoryFormDTO } from "@/modules/catalog/types/category.dto";

export type CategoryFormValues = {
  name: string;
  description: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryFormProps = {
  initial?: CategoryFormDTO;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
};

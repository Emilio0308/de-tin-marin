import type { CategoryListItem } from "@de-tin-marin/validations/category";

export type CategoryFormDTO = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type { CategoryListItem };

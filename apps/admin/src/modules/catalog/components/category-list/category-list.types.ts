import type { CategoryListItem } from "@de-tin-marin/validations/category";

export type CategoryListProps = {
  categories: CategoryListItem[];
  onDelete: (id: string) => void;
  deletingId: string | null;
};

import type { CategoryListItem } from "@de-tin-marin/validations/category";

export type CategoryListLabels = {
  columns: {
    image: string;
    name: string;
    slug: string;
    order: string;
    status: string;
    actions: string;
  };
  statusActive: string;
  statusInactive: string;
  slugPrefix: string;
  edit: string;
  delete: string;
  empty: string;
  emptyFiltered: string;
  formatOrder: (order: number) => string;
  formatSlug: (slug: string) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type CategoryListProps = {
  categories: CategoryListItem[];
  totalCount: number;
  labels: CategoryListLabels;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

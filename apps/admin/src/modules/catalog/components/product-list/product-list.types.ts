import type { ProductListItem } from "@de-tin-marin/validations/product";

export type ProductListLabels = {
  columns: {
    sku: string;
    image: string;
    name: string;
    category: string;
    price: string;
    stock: string;
    status: string;
    actions: string;
  };
  statusActive: string;
  statusInactive: string;
  stockOut: string;
  edit: string;
  empty: string;
  emptyFiltered: string;
  ariaActivate: string;
  ariaDeactivate: string;
  formatStockAvailable: (count: number) => string;
  formatStockLow: (count: number) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type ProductListProps = {
  products: ProductListItem[];
  totalCount: number;
  labels: ProductListLabels;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onToggleActive: (product: ProductListItem) => void;
  togglingId: string | null;
};

import type { ProductListItem } from "@de-tin-marin/validations/product";

export type ProductListLabels = {
  columns: {
    sku: string;
    image: string;
    name: string;
    category: string;
    price: string;
    cost: string;
    margin: string;
    stock: string;
    status: string;
    actions: string;
  };
  marginEmpty: string;
  formatMarginPct: (pct: string) => string;
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
  pagination: {
    summary: string;
    previous: string;
    next: string;
    page: string;
  };
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type ProductListProps = {
  products: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasActiveFilters: boolean;
  labels: ProductListLabels;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  deletingId: string | null;
  onToggleActive: (product: ProductListItem) => void;
  togglingId: string | null;
};

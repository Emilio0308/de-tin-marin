import type { BundleListItem } from "@/modules/catalog/types/bundle.dto";

export type BundleListLabels = {
  columns: {
    bundle: string;
    price: string;
    persons: string;
    status: string;
    actions: string;
  };
  statusActive: string;
  statusDraft: string;
  ariaActivate: string;
  ariaDeactivate: string;
  containerShort: string;
  edit: string;
  empty: string;
  emptyFiltered: string;
  formatItemCount: (count: number) => string;
  formatPersons: (count: number) => string;
  pagination: {
    summary: string;
    previous: string;
    next: string;
    page: string;
  };
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type BundleListProps = {
  bundles: BundleListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasActiveFilters: boolean;
  labels: BundleListLabels;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  deletingId: string | null;
  onToggleActive: (bundle: BundleListItem) => void;
  togglingId: string | null;
};

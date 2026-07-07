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
  containerShort: string;
  edit: string;
  empty: string;
  emptyFiltered: string;
  formatItemCount: (count: number) => string;
  formatPersons: (count: number) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type BundleListProps = {
  bundles: BundleListItem[];
  totalCount: number;
  labels: BundleListLabels;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

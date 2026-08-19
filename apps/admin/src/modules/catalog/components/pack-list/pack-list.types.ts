import type { PackListItem } from "@/modules/catalog/types/pack.dto";

export type PackListLabels = {
  columns: {
    pack: string;
    price: string;
    reference: string;
    status: string;
    actions: string;
  };
  statusActive: string;
  statusDraft: string;
  ariaActivate: string;
  ariaDeactivate: string;
  campaignShort: string;
  edit: string;
  empty: string;
  emptyFiltered: string;
  formatItemCount: (count: number) => string;
  pagination: {
    summary: string;
    previous: string;
    next: string;
    page: string;
  };
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type PackListProps = {
  packs: PackListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasActiveFilters: boolean;
  labels: PackListLabels;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  deletingId: string | null;
  onToggleActive: (pack: PackListItem) => void;
  togglingId: string | null;
};

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
  campaignShort: string;
  edit: string;
  empty: string;
  emptyFiltered: string;
  formatItemCount: (count: number) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
};

export type PackListProps = {
  packs: PackListItem[];
  totalCount: number;
  labels: PackListLabels;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

import type { SurpriseContainerListItem } from "@/modules/catalog/types/surprise-container.dto";

export type ContainerListLabels = {
  columns: {
    sku: string;
    image: string;
    name: string;
    price: string;
    stock: string;
    status: string;
    actions: string;
  };
  statusActive: string;
  statusInactive: string;
  stockCritical: string;
  stockOut: string;
  edit: string;
  delete: string;
  empty: string;
  emptyFiltered: string;
  formatPrice: (amount: number) => string;
  formatStockUnits: (count: number) => string;
  formatPagination: (shown: number, total: number) => string;
  formatAriaEdit: (name: string) => string;
  formatAriaDelete: (name: string) => string;
  stats: {
    totalUnits: string;
    lowStock: string;
    formatLowStockValue: (count: number) => string;
  };
};

export type ContainerListProps = {
  containers: SurpriseContainerListItem[];
  totalCount: number;
  totalStockUnits: number;
  lowStockCount: number;
  labels: ContainerListLabels;
  onDelete: (id: string) => void;
  deletingId: string | null;
};

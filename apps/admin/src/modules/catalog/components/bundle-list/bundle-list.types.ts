import type { BundleListItem } from "@/modules/catalog/types/bundle.dto";

export type BundleListProps = {
  bundles: BundleListItem[];
  onDelete: (id: string) => void;
  deletingId: string | null;
};

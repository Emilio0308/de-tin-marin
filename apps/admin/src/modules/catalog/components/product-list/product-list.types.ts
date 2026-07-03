import type { ProductListItem } from "@de-tin-marin/validations/product";

export type ProductListProps = {
  products: ProductListItem[];
  onDelete: (id: string) => void;
  deletingId: string | null;
};

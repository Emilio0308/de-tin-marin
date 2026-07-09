import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";

export type WizardProductPickerProps = {
  searchValue: string;
  products: PublicProductListItem[];
  selectedProductIds: Set<string>;
  labels: {
    title: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    add: string;
    empty: string;
    maxReached: string;
    alreadyAdded: string;
    loading: string;
    loadingMore: string;
    error: string;
    retry: string;
    expand: string;
    collapse: string;
  };
  canAdd: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onAdd: (product: PublicProductListItem) => void;
};

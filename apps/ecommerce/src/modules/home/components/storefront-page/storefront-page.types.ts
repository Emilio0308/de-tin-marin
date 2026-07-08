import type {
  PublicBundleListItem,
  PublicCategoryItem,
  PublicCatalogSort,
  PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
import type { StorefrontTab } from "@/modules/home/helpers/storefront-url";

export type StorefrontToolbarLabels = {
  searchPlaceholder: string;
  searchAriaLabel: string;
  sortLabel: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  previous: string;
  next: string;
  page: string;
};

export type StorefrontProductsTabProps = {
  categoriesTitle: string;
  allCategoriesLabel: string;
  categories: PublicCategoryItem[];
  activeCategoryId?: string;
  products: PublicProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  sortValue: PublicCatalogSort;
  sortOptions: Array<{ value: PublicCatalogSort; label: string }>;
  labels: StorefrontToolbarLabels & {
    addToCart: string;
    stockLabel: string;
  };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCategoryChange: (categoryId?: string) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSortChange: (sort: PublicCatalogSort) => void;
  onPageChange: (page: number) => void;
  onAddProduct?: (product: PublicProductListItem) => void;
};

export type StorefrontBundlesTabProps = {
  bundles: PublicBundleListItem[];
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  sortValue: PublicCatalogSort;
  sortOptions: Array<{ value: PublicCatalogSort; label: string }>;
  labels: StorefrontToolbarLabels & {
    personalize: string;
  };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSortChange: (sort: PublicCatalogSort) => void;
  onPageChange: (page: number) => void;
};

export type StorefrontPageProps = {
  tab: StorefrontTab;
  tabLabels: {
    products: string;
    bundles: string;
  };
  products: StorefrontProductsTabProps;
  bundles: StorefrontBundlesTabProps;
  onTabChange: (tab: StorefrontTab) => void;
};

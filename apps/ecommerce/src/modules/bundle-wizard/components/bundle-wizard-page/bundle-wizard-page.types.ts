import type { BundleWizardTemplate } from "@de-tin-marin/validations/customize-bundle";
import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";
import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";

export type BundleWizardPageLabels = {
  back: string;
  title: string;
  personCount: string;
  addToCart: string;
  addToCartLoading: string;
  validationMin: string;
  validationMax: string;
  validationDuplicate: string;
  picker: {
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
  price: {
    total: string;
    loading: string;
    invalid: string;
    previewError: string;
    retry: string;
  };
  stock: {
    title: string;
    checking: string;
    productShortage: string;
    containerShortage: string;
  };
};

export type BundleWizardPageProps = {
  template: BundleWizardTemplate;
  components: CustomizeBundleComponent[];
  searchValue: string;
  products: PublicProductListItem[];
  selectedProductIds: Set<string>;
  labelsByProductId: Record<string, string>;
  imagesByProductId: Record<string, string>;
  unitPricesByProductId: Record<string, number>;
  lineTotal: number | null;
  stockCheck: OrderStockCheckResult | null;
  isValid: boolean;
  canRemove: boolean;
  canAdd: boolean;
  isPreviewLoading: boolean;
  isPreviewError: boolean;
  isProductsLoading: boolean;
  isProductsFetchingNextPage: boolean;
  hasMoreProducts: boolean;
  isProductsError: boolean;
  isAddingToCart: boolean;
  labels: BundleWizardPageLabels;
  onRemove: (productId: string) => void;
  onAdd: (product: PublicProductListItem) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onProductsRetry: () => void;
  onLoadMoreProducts: () => void;
  onPreviewRetry: () => void;
  onAddToCart: () => void;
};

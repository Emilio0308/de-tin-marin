export type ProductSearchPickerItem = {
  id: string;
  name: string;
  sku: string;
  netPrice: number;
  unitNetPrice: number;
  finalPrice: number;
  finalUnitPrice: number;
  imageUrl: string | null;
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockTotalBaseUnits: number;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
};

export type ProductSearchPickerLabels = {
  searchPlaceholder: string;
  searchAriaLabel: string;
  empty: string;
  loading: string;
  loadMore: string;
  noMore: string;
  formatUnitPrice: (price: string) => string;
  formatItemsPerPackage: (count: number) => string;
};

export type ProductSearchPickerProps = {
  items: ProductSearchPickerItem[];
  excludeIds: string[];
  searchValue: string;
  isLoading: boolean;
  isError: boolean;
  canLoadMore: boolean;
  labels: ProductSearchPickerLabels;
  onSearchChange: (value: string) => void;
  onSelect: (item: ProductSearchPickerItem) => void;
  onLoadMore: () => void;
  formatPrice?: (price: number) => string;
};

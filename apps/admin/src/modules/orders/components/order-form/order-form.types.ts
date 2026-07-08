export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  finalPrice: number;
  finalUnitPrice: number;
  imageUrl: string | null;
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockTotalBaseUnits: number;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
};

export type BundleOption = {
  id: string;
  name: string;
  containerId: string;
  containerName: string;
  containerNetPrice: number;
  templateQuantity: number;
};

export type OrderFormProductLine = {
  type: "product";
  productId: string;
  quantity: number;
};

export type OrderFormBundleComponent = {
  productId: string;
  quantityPerUnit: number;
};

export type OrderFormBundleLine = {
  type: "bundle";
  bundleId: string;
  quantity: number;
  components: OrderFormBundleComponent[];
};

export type OrderFormLine = OrderFormProductLine | OrderFormBundleLine;

export type OrderFormValues = {
  contact: {
    name: string;
    lastName: string;
    phone: string;
    email: string;
  };
  fulfillment: {
    method: "delivery" | "pickup";
    deliveryAddress: {
      recipientName: string;
      line1: string;
      district: string;
      city: string;
      province: string;
      reference: string;
      phone: string;
    };
    notes: string;
  };
  lines: OrderFormLine[];
  shippingTotal: number;
  discountTotal: number;
};

export const emptyOrderFormValues: OrderFormValues = {
  contact: {
    name: "",
    lastName: "",
    phone: "",
    email: "",
  },
  fulfillment: {
    method: "delivery",
    deliveryAddress: {
      recipientName: "",
      line1: "",
      district: "",
      city: "Piura",
      province: "Piura",
      reference: "",
      phone: "",
    },
    notes: "",
  },
  lines: [],
  shippingTotal: 0,
  discountTotal: 0,
};

export type OrderFormBundleDraft = {
  bundleId: string;
  bundleName: string;
  containerName: string;
  containerNetPrice: number;
  templateQuantity: number;
  templateItems: Array<{ productId: string; productName: string }>;
  components: OrderFormBundleComponent[];
  quantity: number;
  editingLineIndex: number | null;
};

export type OrderFormBundlePriceSummary = {
  itemsSubtotal: number;
  containerSubtotal: number;
  total: number;
};

export type OrderFormLabels = {
  contactSection: string;
  deliverySection: string;
  cartSection: string;
  totalsSection: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
  delivery: string;
  pickup: string;
  recipientName: string;
  address: string;
  district: string;
  city: string;
  province: string;
  reference: string;
  deliveryPhone: string;
  selectDistrict: string;
  product: string;
  selectProduct: string;
  quantity: string;
  addProduct: string;
  surprise: string;
  selectSurprise: string;
  surpriseQuantity: string;
  addSurprise: string;
  removeLine: string;
  emptyLines: string;
  shipping: string;
  shippingHint: string;
  discount: string;
  subtotal: string;
  total: string;
  createOrder: string;
  creating: string;
  productLine: string;
  surpriseLine: string;
  formatComponents: (count: number) => string;
  formatQuantityLabel: (quantity: number) => string;
  quantityBounds: (min: number, max: number) => string;
  configureSurprise: string;
  customizeTitle: string;
  customizeSubtitle: string;
  candyCount: string;
  customizationProgress: string;
  minCandiesReached: string;
  maxCandiesReached: string;
  removeCandy: string;
  addCandy: string;
  selectCandy: string;
  confirmSurprise: string;
  cancelCustomize: string;
  validationMinCandies: string;
  validationMaxCandies: string;
  editSurprise: string;
  candiesSubtotal: string;
  containerSubtotal: string;
  containerCostHint: (unitPrice: string, quantity: number) => string;
  unitPriceSuffix: string;
  customizeTotal: string;
  addCandyAction: string;
  candyAlreadyAdded: string;
  searchCandies: string;
  searchCandiesPlaceholder: string;
  expandPicker: string;
  collapsePicker: string;
  templatePersonCount: (count: number) => string;
  priceCalculating: string;
  surpriseQuantityHint: string;
};

export type OrderFormProps = {
  values: OrderFormValues;
  products: ProductOption[];
  bundles: BundleOption[];
  deliveryDistricts: string[];
  bundleDraft: OrderFormBundleDraft | null;
  bundleDraftLoading: boolean;
  bundlePriceSummary: OrderFormBundlePriceSummary | null;
  bundleUnitPricesByProductId: Record<string, number>;
  isBundlePricePending: boolean;
  totals: {
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    total: number;
  } | null;
  submitting: boolean;
  error: string | null;
  labels: OrderFormLabels;
  onChange: (values: OrderFormValues) => void;
  onAddProductLine: (productId: string, quantity: number) => void;
  onUpdateProductLineQuantity: (index: number, quantity: number) => void;
  onStartBundleDraft: (bundleId: string) => void;
  onBundleDraftComponentsChange: (
    components: OrderFormBundleComponent[],
  ) => void;
  onBundleDraftQuantityChange: (quantity: number) => void;
  onConfirmBundleDraft: () => void;
  onCancelBundleDraft: () => void;
  onEditBundleLine: (index: number) => void;
  onRemoveLine: (index: number) => void;
  getLineTotal: (index: number) => number | null;
  onSubmit: () => void;
};

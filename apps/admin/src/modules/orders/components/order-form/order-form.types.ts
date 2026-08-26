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

export type PackStockShortageOption = {
  productId: string;
  productName: string;
  sku: string;
  availableCombos: number;
  reason: "missing_product" | "inactive" | "insufficient_stock";
};

export type PackOption = {
  id: string;
  name: string;
  sku: string;
  finalPrice: number;
  availableQuantity: number;
  stockShortages: PackStockShortageOption[];
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
  itemCount: number;
};

export type OrderFormProductLine = {
  type: "product";
  productId: string;
  packageQuantity: number;
  unitQuantity: number;
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

export type OrderFormPackLine = {
  type: "pack";
  packId: string;
  quantity: number;
};

export type OrderFormLine =
  OrderFormProductLine | OrderFormBundleLine | OrderFormPackLine;

export type OrderFormValues = {
  contact: {
    name: string;
    lastName: string;
    phone: string;
    email: string;
  };
  fulfillment: {
    method: "delivery" | "pickup" | "pickup_point" | "courier";
    pickupPointId: string;
    courierDepartmentId: string;
    courierProvinceSlug: string;
    courierDni: string;
    courierFullName: string;
    courierAgencyAddress: string;
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
  surchargeTotal: number;
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
    pickupPointId: "",
    courierDepartmentId: "",
    courierProvinceSlug: "",
    courierDni: "",
    courierFullName: "",
    courierAgencyAddress: "",
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
  surchargeTotal: 0,
};

export type OrderFormBundleDraft = {
  bundleId: string;
  bundleName: string;
  containerName: string;
  containerNetPrice: number;
  templateQuantity: number;
  customizationMinProducts: number;
  customizationMaxProducts: number;
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
  pickupPoint: string;
  courier: string;
  selectPickupPoint: string;
  courierDepartment: string;
  selectCourierDepartment: string;
  courierProvince: string;
  selectCourierProvince: string;
  courierDni: string;
  courierFullName: string;
  courierAgencyAddress: string;
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
  removeLine: string;
  emptyLines: string;
  shipping: string;
  shippingHint: string;
  discount: string;
  surcharge: string;
  finalPrice: string;
  finalPriceHint: string;
  tabFinalPrice: string;
  tabAdjustments: string;
  subtotal: string;
  total: string;
  createOrder: string;
  creating: string;
  productLine: string;
  surpriseLine: string;
  formatComponents: (count: number) => string;
  viewComponents: (count: number) => string;
  formatPackComponentQty: (packages: number, units: number) => string;
  formatProductDualQty: (packages: number, units: number) => string;
  formatQuantityLabel: (quantity: number) => string;
  packagesLabel: string;
  unitsLabel: string;
  quantityBounds: (min: number, max: number) => string;
  configureSurprise: string;
  addSurprise: string;
  addingSurprise: string;
  tabProducts: string;
  tabCombos: string;
  tabSurprises: string;
  selectProductFirst: string;
  productOutOfStock: (min: number, available: number) => string;
  customizeTitle: string;
  customizeSubtitle: (min: number, max: number) => string;
  candyCount: string;
  customizationProgress: string;
  minCandiesReached: (min: number) => string;
  maxCandiesReached: (max: number) => string;
  removeCandy: string;
  addCandy: string;
  selectCandy: string;
  confirmSurprise: string;
  cancelCustomize: string;
  validationMinCandies: (min: number) => string;
  validationMaxCandies: (max: number) => string;
  editSurprise: string;
  combo: string;
  selectCombo: string;
  selectComboFirst: string;
  addCombo: string;
  comboLine: string;
  packOutOfStock: (available: number) => string;
  packStockShortages: (names: string) => string;
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

export type OrderFormFieldErrors = Record<string, string>;

export type OrderFormProps = {
  values: OrderFormValues;
  products: ProductOption[];
  bundles: BundleOption[];
  packs: PackOption[];
  packCompositionsById: Map<
    string,
    Array<{ productId: string; productName: string; quantityLabel: string }>
  >;
  deliveryDistricts: string[];
  pickupPoints: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    fee: number;
    isActive: boolean;
  }>;
  courierDepartments: Array<{
    id: string;
    name: string;
    provinces: Array<{ slug: string; name: string; enabled: boolean }>;
  }>;
  bundleDraft: OrderFormBundleDraft | null;
  bundleDraftLoading: boolean;
  bundlePriceSummary: OrderFormBundlePriceSummary | null;
  bundleUnitPricesByProductId: Record<string, number>;
  isBundlePricePending: boolean;
  totals: {
    subtotal: number;
    discountTotal: number;
    surchargeTotal: number;
    shippingTotal: number;
    total: number;
  } | null;
  submitting: boolean;
  error: string | null;
  fieldErrors: OrderFormFieldErrors;
  labels: OrderFormLabels;
  onChange: (values: OrderFormValues) => void;
  onFieldBlur: (path: string) => void;
  onEnsureProductOption: (product: ProductOption) => void;
  onAddProductLine: (
    productId: string,
    packageQuantity: number,
    unitQuantity: number,
  ) => void;
  onUpdateProductLineQuantity: (
    index: number,
    packageQuantity: number,
    unitQuantity: number,
  ) => void;
  onAddPackLine: (packId: string, quantity: number) => void;
  onStartBundleDraft: (bundleId: string) => void;
  onAddBundleAsTemplate: (bundleId: string) => void;
  onAddBundleCandy: (product: ProductOption) => void;
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

import type { CatalogStatusSection } from "../schemas/export-catalog-status.schema";

export type CatalogStatusReportMeta = {
  generatedAt: string;
  sections: CatalogStatusSection[];
  timezone: "UTC";
};

export type CatalogStatusProductRow = {
  sku: string;
  name: string;
  description: string | null;
  slug: string;
  brand: string | null;
  categoryName: string;
  productType: "unit" | "package";
  itemsPerPackage: number;
  packageLabel: string | null;
  netPrice: number;
  unitNetPrice: number;
  finalPrice: number;
  finalUnitPrice: number;
  campaignName: string | null;
  campaignPercentage: number | null;
  costNetPrice: number | null;
  margin: number | null;
  marginPct: number | null;
  stockSealedPackages: number;
  stockLooseBaseUnits: number;
  stockTotalBaseUnits: number;
  stockDisplay: string;
  stockInPresentations: number;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
};

export type CatalogStatusBundleRow = {
  name: string;
  description: string | null;
  isActive: boolean;
  quantity: number;
  containerSku: string;
  containerName: string;
  containerNetPrice: number;
  containerStock: number;
  itemCount: number;
  itemsSubtotal: number;
  containerSubtotal: number;
  total: number;
  imageUrl: string | null;
};

export type CatalogStatusBundleCompositionRow = {
  bundleName: string;
  productSku: string;
  productName: string;
  unitsPerPerson: number;
  unitNetPrice: number;
  productIsActive: boolean;
  productStockDisplay: string;
};

export type CatalogStatusPackRow = {
  sku: string;
  name: string;
  description: string | null;
  slug: string;
  referencePrice: number;
  normalPrice: number;
  finalPrice: number;
  campaignName: string | null;
  campaignPercentage: number | null;
  itemCount: number;
  availableQuantity: number;
  purchaseMinQuantity: number;
  purchaseMaxQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
};

export type CatalogStatusPackCompositionRow = {
  packSku: string;
  packName: string;
  productSku: string;
  productName: string;
  packageQuantity: number;
  unitQuantity: number;
  packageNetPrice: number;
  unitNetPrice: number;
  productPresentations: number;
  productIsActive: boolean;
};

export type CatalogStatusContainerRow = {
  sku: string;
  name: string;
  description: string | null;
  netPrice: number;
  stockQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
};

export type CatalogStatusOrderListRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  fulfillmentMethod: string | null;
  subtotal: number;
  discountTotal: number;
  surchargeTotal: number;
  shippingTotal: number;
  total: number;
  lineCount: number;
  currencyCode: string;
  createdAt: string;
  cartAnchor: string;
};

export type CatalogStatusOrderCartLineRow = {
  level: "line" | "component" | "container";
  lineType: "product" | "pack" | "bundle" | "";
  sku: string;
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
  detail: string | null;
};

export type CatalogStatusOrderCartBlock = {
  orderNumber: string;
  cartAnchor: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  total: number;
  lines: CatalogStatusOrderCartLineRow[];
};

export type CatalogStatusReportData = {
  meta: CatalogStatusReportMeta;
  products: CatalogStatusProductRow[];
  bundles: CatalogStatusBundleRow[];
  bundleComposition: CatalogStatusBundleCompositionRow[];
  packs: CatalogStatusPackRow[];
  packComposition: CatalogStatusPackCompositionRow[];
  containers: CatalogStatusContainerRow[];
  orders: CatalogStatusOrderListRow[];
  orderCarts: CatalogStatusOrderCartBlock[];
};

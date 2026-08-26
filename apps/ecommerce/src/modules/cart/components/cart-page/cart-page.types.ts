import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import type { StoredCartLine } from "../../repositories/cart.repository";

export type CartPageLabels = {
  title: string;
  subtitle: string;
  empty: string;
  emptyHint: string;
  continueShopping: string;
  checkout: string;
  remove: string;
  subtotal: string;
  summaryTitle: string;
  itemCount: string;
  unitPriceSuffix: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  components: string;
  stockTitle: string;
  stockProduct: string;
  stockContainer: string;
  stockChecking: string;
  bundleBadge: string;
  packBadge: string;
  packComponents: string;
  stepsLabel: string;
  stepCart: string;
  stepCheckout: string;
  stepDone: string;
};

export type CartPageProps = {
  lines: StoredCartLine[];
  subtotal: number;
  labels: CartPageLabels;
  lineImageUrlByCartLineId: Record<string, string>;
  productBoundsByCartLineId: Record<string, ProductPurchaseBounds>;
  formatBundlePersons: (count: number) => string;
  isStockPending: boolean;
  stockWarning: boolean;
  stockMessages: string[];
  onUpdateQuantity: (
    cartLineId: string,
    quantity: number,
    bounds: ProductPurchaseBounds,
  ) => void;
  onRemove: (cartLineId: string) => void;
};

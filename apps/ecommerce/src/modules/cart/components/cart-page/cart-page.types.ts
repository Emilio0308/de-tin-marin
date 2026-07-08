import type { StoredCartLine } from "../../repositories/cart.repository";

export type CartPageLabels = {
  title: string;
  empty: string;
  continueShopping: string;
  checkout: string;
  remove: string;
  subtotal: string;
  unitPriceSuffix: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  components: string;
  stockTitle: string;
  stockProduct: string;
  stockContainer: string;
  stockChecking: string;
  bundleBadge: string;
};

export type CartPageProps = {
  lines: StoredCartLine[];
  subtotal: number;
  labels: CartPageLabels;
  lineImageUrlByCartLineId: Record<string, string>;
  formatBundlePersons: (count: number) => string;
  isStockPending: boolean;
  stockWarning: boolean;
  stockMessages: string[];
  onUpdateQuantity: (cartLineId: string, quantity: number) => void;
  onRemove: (cartLineId: string) => void;
};

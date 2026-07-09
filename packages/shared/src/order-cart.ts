import { roundMoney } from "./prices";

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "delivered",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "confirmed", "refunded"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type OrderShoppingCartProductLine = {
  type: "product";
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string | null;
};

export type OrderShoppingCartBundleComponent = {
  productId: string;
  productName: string;
  sku: string;
  quantityPerUnit: number;
  totalQuantity: number;
  unitPrice: number;
};

export type OrderShoppingCartBundleContainer = {
  containerId: string;
  sku: string;
  name: string;
  unitPrice: number;
};

export type OrderShoppingCartBundleLine = {
  type: "bundle";
  bundleId: string;
  name: string;
  quantity: number;
  container?: OrderShoppingCartBundleContainer;
  /** @deprecated Legacy orders pre-S1E */
  serviceFee?: number;
  lineTotal: number;
  components: OrderShoppingCartBundleComponent[];
  imageUrl?: string | null;
};

export type OrderShoppingCartLine =
  OrderShoppingCartProductLine | OrderShoppingCartBundleLine;

export type OrderShoppingCart = {
  lines: OrderShoppingCartLine[];
};

export type ProductForOrderLine = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
};

export type BundleComponentInput = {
  productId: string;
  quantityPerUnit: number;
};

export type BuildProductLineInput = {
  type: "product";
  productId: string;
  quantity: number;
};

export type BuildBundleLineInput = {
  type: "bundle";
  bundleId: string;
  name: string;
  quantity: number;
  container: OrderShoppingCartBundleContainer;
  components: BundleComponentInput[];
};

export type BuildShoppingCartInput = {
  lines: Array<BuildProductLineInput | BuildBundleLineInput>;
  productsById: Map<string, ProductForOrderLine>;
};

export type OrderTotals = {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getBundleLineContainerUnitPrice(
  line: OrderShoppingCartBundleLine,
): number {
  if (line.container) return line.container.unitPrice;
  return line.serviceFee ?? 0;
}

export function buildProductLine(
  product: ProductForOrderLine,
  quantity: number,
): OrderShoppingCartProductLine {
  const unitPrice = roundMoney(product.unitPrice);
  return {
    type: "product",
    productId: product.id,
    sku: product.sku,
    name: product.name,
    quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
  };
}

export function buildBundleLine(
  bundleId: string,
  name: string,
  quantity: number,
  container: OrderShoppingCartBundleContainer,
  components: BundleComponentInput[],
  productsById: Map<string, ProductForOrderLine>,
): OrderShoppingCartBundleLine {
  const frozenComponents: OrderShoppingCartBundleComponent[] = components.map(
    (component) => {
      const product = productsById.get(component.productId);
      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND:${component.productId}`);
      }
      const unitPrice = roundMoney(product.unitPrice);
      const totalQuantity = component.quantityPerUnit * quantity;
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantityPerUnit: component.quantityPerUnit,
        totalQuantity,
        unitPrice,
      };
    },
  );

  const componentsSubtotal = roundMoney(
    frozenComponents.reduce(
      (sum, item) => sum + item.unitPrice * item.totalQuantity,
      0,
    ),
  );
  const containerUnitPrice = roundMoney(container.unitPrice);
  const lineTotal = roundMoney(
    componentsSubtotal + containerUnitPrice * quantity,
  );

  return {
    type: "bundle",
    bundleId,
    name,
    quantity,
    container: {
      containerId: container.containerId,
      sku: container.sku,
      name: container.name,
      unitPrice: containerUnitPrice,
    },
    lineTotal,
    components: frozenComponents,
  };
}

export function buildShoppingCart(
  input: BuildShoppingCartInput,
): OrderShoppingCart {
  const lines: OrderShoppingCartLine[] = input.lines.map((line) => {
    if (line.type === "product") {
      const product = input.productsById.get(line.productId);
      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND:${line.productId}`);
      }
      return buildProductLine(product, line.quantity);
    }

    return buildBundleLine(
      line.bundleId,
      line.name,
      line.quantity,
      line.container,
      line.components,
      input.productsById,
    );
  });

  return { lines };
}

export function computeOrderTotals(
  shoppingCart: OrderShoppingCart,
  options: { discountTotal?: number; shippingTotal?: number } = {},
): OrderTotals {
  const discountTotal = roundMoney(options.discountTotal ?? 0);
  const shippingTotal = roundMoney(options.shippingTotal ?? 0);
  const subtotal = roundMoney(
    shoppingCart.lines.reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const total = roundMoney(subtotal - discountTotal + shippingTotal);

  return { subtotal, discountTotal, shippingTotal, total };
}

export function formatOrderNumber(sequence: number, date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `TM-${year}${month}${day}-${String(sequence).padStart(4, "0")}`;
}

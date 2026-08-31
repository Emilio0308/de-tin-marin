import { computeBundlePerSurprisePrice } from "./bundle-price";
import type { OrderFulfillmentMethod } from "./delivery-fee";
import { roundMoney } from "./prices";

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "awaiting_pickup",
  "in_transit",
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
  packageQuantity: number;
  unitQuantity: number;
  /** Precio por presentación (final). */
  packagePrice: number;
  /** Precio por unidad base (finalUnitPrice). */
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
  /** Raw line total (Σ componentes + envases, sin normalizar). */
  lineTotal: number;
  /** Precio comercial por sorpresa (ceil al step configurado). Ausente en órdenes legacy. */
  normalizedPerSurprisePrice?: number;
  /** Precio comercial de la línea (quantity × normalizedPerSurprisePrice). Ausente en órdenes legacy. */
  normalizedLineTotal?: number;
  components: OrderShoppingCartBundleComponent[];
  imageUrl?: string | null;
};

export type OrderShoppingCartPackComponent = {
  productId: string;
  productName: string;
  sku: string;
  packageQuantity: number;
  unitQuantity: number;
  totalPackages: number;
  totalUnits: number;
};

export type OrderShoppingCartPackLine = {
  type: "pack";
  packId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  components: OrderShoppingCartPackComponent[];
  imageUrl?: string | null;
};

export type OrderShoppingCartLine =
  | OrderShoppingCartProductLine
  | OrderShoppingCartBundleLine
  | OrderShoppingCartPackLine;

export type OrderShoppingCart = {
  lines: OrderShoppingCartLine[];
};

export type ProductForOrderLine = {
  id: string;
  sku: string;
  name: string;
  /** Precio por unidad base (dulce) — componentes de bundle y unitQuantity. */
  unitPrice: number;
  /** Precio por presentación — packageQuantity en líneas `type: product`. */
  presentationPrice: number;
  itemsPerPackage: number;
};

export type BundleComponentInput = {
  productId: string;
  quantityPerUnit: number;
};

export type BuildProductLineInput = {
  type: "product";
  productId: string;
  packageQuantity: number;
  unitQuantity: number;
};

export type BuildBundleLineInput = {
  type: "bundle";
  bundleId: string;
  name: string;
  quantity: number;
  container: OrderShoppingCartBundleContainer;
  components: BundleComponentInput[];
};

export type PackComponentInput = {
  productId: string;
  packageQuantity: number;
  unitQuantity: number;
};

export type PackForOrderLine = {
  id: string;
  sku: string;
  name: string;
  /** Precio de venta del combo (finalPrice con campaña). */
  unitPrice: number;
  imageUrl?: string | null;
};

export type BuildPackLineInput = {
  type: "pack";
  packId: string;
  quantity: number;
  pack: PackForOrderLine;
  components: PackComponentInput[];
};

export type BuildShoppingCartInput = {
  lines: Array<
    BuildProductLineInput | BuildBundleLineInput | BuildPackLineInput
  >;
  productsById: Map<string, ProductForOrderLine>;
  /** Bundle components always use prices.unit.netPrice (no campaigns). */
  bundleComponentUnitPricesById?: Map<string, number>;
};

export type OrderTotals = {
  subtotal: number;
  discountTotal: number;
  surchargeTotal: number;
  shippingTotal: number;
  total: number;
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["awaiting_pickup", "in_transit", "cancelled"],
  awaiting_pickup: ["delivered", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export function nextLogisticStatus(
  method: OrderFulfillmentMethod,
): Extract<OrderStatus, "awaiting_pickup" | "in_transit"> {
  return method === "pickup" ? "awaiting_pickup" : "in_transit";
}

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
  method?: OrderFulfillmentMethod,
): boolean {
  if (from === to) return false;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) return false;

  if (from === "ready" && (to === "awaiting_pickup" || to === "in_transit")) {
    if (!method) return false;
    return nextLogisticStatus(method) === to;
  }

  return true;
}

export function getBundleLineContainerUnitPrice(
  line: OrderShoppingCartBundleLine,
): number {
  if (line.container) return line.container.unitPrice;
  return line.serviceFee ?? 0;
}

/** Monto cobrable de una línea bundle (legacy sin campos normalizados → lineTotal). */
export function getBundleLineChargeableTotal(
  line: OrderShoppingCartBundleLine,
): number {
  return line.normalizedLineTotal ?? line.lineTotal;
}

function lineSubtotalForOrder(line: OrderShoppingCartLine): number {
  if (line.type === "bundle") return getBundleLineChargeableTotal(line);
  return line.lineTotal;
}

export function normalizeProductLineQuantities(
  packageQuantity: number,
  unitQuantity: number,
  itemsPerPackage: number,
): { packageQuantity: number; unitQuantity: number } {
  const ipp = Math.max(1, Math.floor(itemsPerPackage));
  let packages = Math.max(0, Math.floor(packageQuantity));
  let units = Math.max(0, Math.floor(unitQuantity));
  packages += Math.floor(units / ipp);
  units = units % ipp;
  return { packageQuantity: packages, unitQuantity: units };
}

export function buildProductLine(
  product: ProductForOrderLine,
  packageQuantity: number,
  unitQuantity: number,
): OrderShoppingCartProductLine {
  const normalized = normalizeProductLineQuantities(
    packageQuantity,
    unitQuantity,
    product.itemsPerPackage,
  );
  const packagePrice = roundMoney(product.presentationPrice);
  const unitPrice = roundMoney(product.unitPrice);
  return {
    type: "product",
    productId: product.id,
    sku: product.sku,
    name: product.name,
    packageQuantity: normalized.packageQuantity,
    unitQuantity: normalized.unitQuantity,
    packagePrice,
    unitPrice,
    lineTotal: roundMoney(
      packagePrice * normalized.packageQuantity +
        unitPrice * normalized.unitQuantity,
    ),
  };
}

export function buildBundleLine(
  bundleId: string,
  name: string,
  quantity: number,
  container: OrderShoppingCartBundleContainer,
  components: BundleComponentInput[],
  productsById: Map<string, ProductForOrderLine>,
  bundleComponentUnitPricesById?: Map<string, number>,
): OrderShoppingCartBundleLine {
  const frozenComponents: OrderShoppingCartBundleComponent[] = components.map(
    (component) => {
      const product = productsById.get(component.productId);
      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND:${component.productId}`);
      }
      const bundleUnitPrice = bundleComponentUnitPricesById?.get(
        component.productId,
      );
      const unitPrice = roundMoney(bundleUnitPrice ?? product.unitPrice);
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
  const perSurprise = computeBundlePerSurprisePrice({
    containerNetPrice: containerUnitPrice,
    items: frozenComponents.map((component) => ({
      unitNetPrice: component.unitPrice,
      unitsPerPerson: component.quantityPerUnit,
    })),
  });
  const normalizedPerSurprisePrice = perSurprise.normalizedPerSurprisePrice;
  const normalizedLineTotal = roundMoney(normalizedPerSurprisePrice * quantity);

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
    normalizedPerSurprisePrice,
    normalizedLineTotal,
    components: frozenComponents,
  };
}

export function buildPackLine(
  pack: PackForOrderLine,
  quantity: number,
  components: PackComponentInput[],
  productsById: Map<string, ProductForOrderLine>,
): OrderShoppingCartPackLine {
  const frozenComponents: OrderShoppingCartPackComponent[] = components.map(
    (component) => {
      const product = productsById.get(component.productId);
      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND:${component.productId}`);
      }
      const packageQuantity = Math.max(
        0,
        Math.floor(component.packageQuantity),
      );
      const unitQuantity = Math.max(0, Math.floor(component.unitQuantity));
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        packageQuantity,
        unitQuantity,
        totalPackages: packageQuantity * quantity,
        totalUnits: unitQuantity * quantity,
      };
    },
  );

  const unitPrice = roundMoney(pack.unitPrice);
  return {
    type: "pack",
    packId: pack.id,
    sku: pack.sku,
    name: pack.name,
    quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
    components: frozenComponents,
    imageUrl: pack.imageUrl ?? null,
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
      return buildProductLine(product, line.packageQuantity, line.unitQuantity);
    }

    if (line.type === "pack") {
      return buildPackLine(
        line.pack,
        line.quantity,
        line.components,
        input.productsById,
      );
    }

    return buildBundleLine(
      line.bundleId,
      line.name,
      line.quantity,
      line.container,
      line.components,
      input.productsById,
      input.bundleComponentUnitPricesById,
    );
  });

  return { lines };
}

export function computeOrderTotals(
  shoppingCart: OrderShoppingCart,
  options: {
    discountTotal?: number;
    shippingTotal?: number;
    surchargeTotal?: number;
  } = {},
): OrderTotals {
  const discountTotal = roundMoney(options.discountTotal ?? 0);
  const surchargeTotal = roundMoney(options.surchargeTotal ?? 0);
  const shippingTotal = roundMoney(options.shippingTotal ?? 0);
  const subtotal = roundMoney(
    shoppingCart.lines.reduce(
      (sum, line) => sum + lineSubtotalForOrder(line),
      0,
    ),
  );
  const total = roundMoney(
    subtotal - discountTotal + shippingTotal + surchargeTotal,
  );

  return { subtotal, discountTotal, surchargeTotal, shippingTotal, total };
}

/**
 * Derives exclusive discount XOR surcharge so that
 * `subtotal - discount + shipping + surcharge === finalTotal`.
 * Base (no adjustments) = subtotal + shipping.
 */
export function deriveAdjustmentsFromFinalPrice(input: {
  subtotal: number;
  shippingTotal: number;
  finalTotal: number;
}): { discountTotal: number; surchargeTotal: number } {
  const subtotal = roundMoney(input.subtotal);
  const shippingTotal = roundMoney(input.shippingTotal);
  const finalTotal = roundMoney(Math.max(0, input.finalTotal));
  const base = roundMoney(subtotal + shippingTotal);
  const delta = roundMoney(finalTotal - base);

  if (delta < 0) {
    return { discountTotal: roundMoney(-delta), surchargeTotal: 0 };
  }
  if (delta > 0) {
    return { discountTotal: 0, surchargeTotal: delta };
  }
  return { discountTotal: 0, surchargeTotal: 0 };
}

export function formatOrderNumber(sequence: number, date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `TM-${year}${month}${day}-${String(sequence).padStart(4, "0")}`;
}

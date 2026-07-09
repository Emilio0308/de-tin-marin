import { computeTotalBaseUnits, deductBaseUnits } from "./product-stock";
import type { OrderShoppingCart } from "./order-cart";

export type StockInventoryProduct = {
  id: string;
  sku: string;
  name?: string;
  stockSealedPackages: number;
  stockLooseBaseUnits: number;
  itemsPerPackage: number;
};

export type StockInventoryContainer = {
  id: string;
  sku: string;
  name?: string;
  stockQuantity: number;
};

export type StockShortage = {
  kind: "product" | "container";
  id: string;
  sku: string;
  name?: string;
  required: number;
  available: number;
};

export type OrderStockCheckResult =
  { ok: true } | { ok: false; shortages: StockShortage[] };

export type StockDemand = {
  sku: string;
  name?: string;
  /** Cantidad en presentaciones vendidas (líneas `type: product`). */
  presentationQuantity: number;
  /** Unidades base consumidas (componentes de bundle). */
  baseUnits: number;
};

export function resolveProductBaseUnitsNeed(
  demand: StockDemand,
  itemsPerPackage: number,
): number {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  return demand.presentationQuantity * safeItems + demand.baseUnits;
}

export type ContainerStockDemand = {
  need: number;
  sku: string;
  name?: string;
};

export function aggregateStockDemands(cart: OrderShoppingCart): {
  products: Map<string, StockDemand>;
  containers: Map<string, ContainerStockDemand>;
} {
  const products = new Map<string, StockDemand>();
  const containers = new Map<string, ContainerStockDemand>();

  for (const line of cart.lines) {
    if (line.type === "product") {
      const existing = products.get(line.productId);
      products.set(line.productId, {
        presentationQuantity:
          (existing?.presentationQuantity ?? 0) + line.quantity,
        baseUnits: existing?.baseUnits ?? 0,
        sku: line.sku,
        name: line.name,
      });
      continue;
    }

    for (const component of line.components) {
      const existing = products.get(component.productId);
      products.set(component.productId, {
        presentationQuantity: existing?.presentationQuantity ?? 0,
        baseUnits: (existing?.baseUnits ?? 0) + component.totalQuantity,
        sku: component.sku,
        name: component.productName,
      });
    }

    if (line.container) {
      const existing = containers.get(line.container.containerId);
      containers.set(line.container.containerId, {
        need: (existing?.need ?? 0) + line.quantity,
        sku: line.container.sku,
        name: line.container.name,
      });
    }
  }

  return { products, containers };
}

export function checkOrderStock(
  cart: OrderShoppingCart,
  productsById: Map<string, StockInventoryProduct>,
  containersById: Map<string, StockInventoryContainer>,
): OrderStockCheckResult {
  const { products, containers } = aggregateStockDemands(cart);
  const shortages: StockShortage[] = [];

  for (const [productId, demand] of products) {
    const product = productsById.get(productId);
    if (!product) {
      const baseUnitsNeed = resolveProductBaseUnitsNeed(demand, 1);
      shortages.push({
        kind: "product",
        id: productId,
        sku: demand.sku,
        name: demand.name,
        required: baseUnitsNeed,
        available: 0,
      });
      continue;
    }

    const available = computeTotalBaseUnits(
      product.stockSealedPackages,
      product.stockLooseBaseUnits,
      product.itemsPerPackage,
    );
    const baseUnitsNeed = resolveProductBaseUnitsNeed(
      demand,
      product.itemsPerPackage,
    );
    const result = deductBaseUnits(
      product.stockSealedPackages,
      product.stockLooseBaseUnits,
      product.itemsPerPackage,
      baseUnitsNeed,
    );

    if (result === "INSUFFICIENT_STOCK") {
      shortages.push({
        kind: "product",
        id: productId,
        sku: product.sku,
        name: product.name ?? demand.name,
        required: baseUnitsNeed,
        available,
      });
    }
  }

  for (const [containerId, demand] of containers) {
    const container = containersById.get(containerId);
    const available = container?.stockQuantity ?? 0;
    if (!container || available < demand.need) {
      shortages.push({
        kind: "container",
        id: containerId,
        sku: container?.sku ?? demand.sku,
        name: container?.name ?? demand.name,
        required: demand.need,
        available,
      });
    }
  }

  if (shortages.length > 0) {
    return { ok: false, shortages };
  }

  return { ok: true };
}

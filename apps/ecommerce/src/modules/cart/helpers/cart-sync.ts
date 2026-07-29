import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";
import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import type { StoredCartLine } from "../repositories/cart.repository";
import { applyServerCartPricing } from "./cart-lines";

export const CART_SYNC_STORAGE_KEY = "dtm-cart-sync";

export type CartSyncPayload = {
  priceChanged: boolean;
  stockChanged: boolean;
  lines: OrderShoppingCartLine[];
  removedCount: number;
  stock: OrderStockCheckResult;
};

export function writeCartSyncPayload(payload: CartSyncPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CART_SYNC_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // ignore
  }
}

export function readCartSyncPayload(): CartSyncPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CART_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartSyncPayload;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCartSyncPayload(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CART_SYNC_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function detectCartPriceDrift(
  stored: StoredCartLine[],
  serverLines: OrderShoppingCartLine[],
): boolean {
  if (stored.length !== serverLines.length) return true;

  for (let index = 0; index < stored.length; index += 1) {
    const local = stored[index]?.line;
    const server = serverLines[index];
    if (!local || !server || local.type !== server.type) return true;

    if (local.type === "product" && server.type === "product") {
      if (
        local.unitPrice !== server.unitPrice ||
        local.lineTotal !== server.lineTotal
      ) {
        return true;
      }
      continue;
    }

    if (local.type === "pack" && server.type === "pack") {
      if (
        local.unitPrice !== server.unitPrice ||
        local.lineTotal !== server.lineTotal
      ) {
        return true;
      }
      continue;
    }

    if (local.type === "bundle" && server.type === "bundle") {
      if (local.lineTotal !== server.lineTotal) return true;
    }
  }

  return false;
}

/**
 * Removes lines that are not purchasable or that consume products/containers
 * reported as stock shortages.
 */
export function purgeCartLinesByStockAndBounds(
  stored: StoredCartLine[],
  stock: OrderStockCheckResult,
  boundsByCartLineId: Record<string, ProductPurchaseBounds>,
): { lines: StoredCartLine[]; removedCount: number } {
  const shortageProductIds = new Set(
    stock.ok
      ? []
      : stock.shortages
          .filter((item) => item.kind === "product")
          .map((item) => item.id),
  );
  const shortageContainerIds = new Set(
    stock.ok
      ? []
      : stock.shortages
          .filter((item) => item.kind === "container")
          .map((item) => item.id),
  );

  const next: StoredCartLine[] = [];
  let removedCount = 0;

  for (const entry of stored) {
    const { line, cartLineId } = entry;

    if (line.type === "product" || line.type === "pack") {
      const bounds = boundsByCartLineId[cartLineId];
      if (bounds && !bounds.purchasable) {
        removedCount += 1;
        continue;
      }
    }

    if (line.type === "product" && shortageProductIds.has(line.productId)) {
      removedCount += 1;
      continue;
    }

    if (line.type === "pack") {
      const hitsShortage = line.components.some((component) =>
        shortageProductIds.has(component.productId),
      );
      if (hitsShortage) {
        removedCount += 1;
        continue;
      }
    }

    if (line.type === "bundle") {
      const componentHit = line.components.some((component) =>
        shortageProductIds.has(component.productId),
      );
      const containerHit = Boolean(
        line.container && shortageContainerIds.has(line.container.containerId),
      );
      if (componentHit || containerHit) {
        removedCount += 1;
        continue;
      }
    }

    next.push(entry);
  }

  return { lines: next, removedCount };
}

export function rebuildCartFromServerSync(
  stored: StoredCartLine[],
  serverLines: OrderShoppingCartLine[],
  stock: OrderStockCheckResult,
  boundsByCartLineId: Record<string, ProductPurchaseBounds>,
): { lines: StoredCartLine[]; removedCount: number; priceChanged: boolean } {
  const priceChanged = detectCartPriceDrift(stored, serverLines);
  const priced = applyServerCartPricing(stored, serverLines);
  const purged = purgeCartLinesByStockAndBounds(
    priced,
    stock,
    boundsByCartLineId,
  );
  return {
    lines: purged.lines,
    removedCount: purged.removedCount,
    priceChanged,
  };
}

import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import {
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
} from "@de-tin-marin/shared/product-purchase-limits";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import type {
  OrderShoppingCartBundleLine,
  OrderShoppingCartLine,
  OrderShoppingCartProductLine,
} from "@de-tin-marin/shared/order-cart";
import { coerceMoney, roundMoney } from "@de-tin-marin/shared/prices";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { resolveProductPurchaseLimits } from "@/modules/catalog/helpers/product-purchase-limits";
import type { StoredCartLine } from "../repositories/cart.repository";

function normalizeCartImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === "") {
    return CATALOG_PLACEHOLDER_IMAGE;
  }
  return imageUrl;
}

export function createProductCartLine(
  product: PublicProductListItem,
  quantity = product.purchaseMinQuantity,
): OrderShoppingCartProductLine {
  const bounds = resolveProductPurchaseLimits(product);
  const safeQuantity = clampProductPurchaseQuantity(quantity, bounds);
  const unitPrice = roundMoney(product.finalPrice);
  return {
    type: "product",
    productId: product.id,
    sku: product.sku,
    name: product.name,
    quantity: safeQuantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * safeQuantity),
    imageUrl: normalizeCartImageUrl(product.imageUrl),
  };
}

export function mergeProductLine(
  lines: StoredCartLine[],
  product: PublicProductListItem,
  quantity = product.purchaseMinQuantity,
): StoredCartLine[] {
  return mergeProductCartLine(
    lines,
    createProductCartLine(product, quantity),
    resolveProductPurchaseLimits(product),
  );
}

export function mergeProductCartLine(
  lines: StoredCartLine[],
  line: OrderShoppingCartProductLine,
  bounds: ProductPurchaseBounds,
): StoredCartLine[] {
  if (!bounds.purchasable) return lines;

  const existing = lines.find(
    (entry) =>
      entry.line.type === "product" && entry.line.productId === line.productId,
  );

  if (!existing || existing.line.type !== "product") {
    const quantity = clampProductPurchaseQuantity(line.quantity, bounds);
    return [
      ...lines,
      {
        cartLineId: crypto.randomUUID(),
        line: {
          ...line,
          quantity,
          lineTotal: roundMoney(line.unitPrice * quantity),
        },
      },
    ];
  }

  const nextQuantity = mergeProductPurchaseQuantity(
    existing.line.quantity,
    line.quantity,
    bounds,
  );
  const unitPrice = existing.line.unitPrice;

  return lines.map((entry) =>
    entry.cartLineId === existing.cartLineId
      ? {
          ...entry,
          line: {
            ...existing.line,
            quantity: nextQuantity,
            lineTotal: roundMoney(unitPrice * nextQuantity),
            imageUrl: existing.line.imageUrl ?? line.imageUrl,
          },
        }
      : entry,
  );
}

export function addBundleCartLine(
  lines: StoredCartLine[],
  bundleLine: OrderShoppingCartBundleLine,
): StoredCartLine[] {
  return [
    ...lines,
    {
      cartLineId: crypto.randomUUID(),
      line: bundleLine,
    },
  ];
}

export function updateStoredProductQuantity(
  lines: StoredCartLine[],
  cartLineId: string,
  quantity: number,
  bounds: ProductPurchaseBounds,
): StoredCartLine[] {
  if (!bounds.purchasable) return lines;

  const nextQuantity = clampProductPurchaseQuantity(quantity, bounds);
  if (nextQuantity < bounds.minQuantity) return lines;

  return lines.map((entry) => {
    if (entry.cartLineId !== cartLineId || entry.line.type !== "product") {
      return entry;
    }

    return {
      ...entry,
      line: {
        ...entry.line,
        quantity: nextQuantity,
        lineTotal: roundMoney(entry.line.unitPrice * nextQuantity),
      },
    };
  });
}

export function removeStoredCartLine(
  lines: StoredCartLine[],
  cartLineId: string,
): StoredCartLine[] {
  return lines.filter((entry) => entry.cartLineId !== cartLineId);
}

export function toShoppingCartLines(lines: StoredCartLine[]) {
  return lines.map((entry) => entry.line);
}

export function sanitizeStoredCartLine(entry: StoredCartLine): StoredCartLine {
  const { line } = entry;

  if (line.type === "product") {
    const unitPrice = coerceMoney(line.unitPrice);
    const quantity =
      typeof line.quantity === "number" && line.quantity > 0
        ? line.quantity
        : 1;

    return {
      ...entry,
      line: {
        ...line,
        quantity,
        unitPrice,
        lineTotal: roundMoney(unitPrice * quantity),
      },
    };
  }

  return {
    ...entry,
    line: {
      ...line,
      lineTotal: coerceMoney(line.lineTotal),
      container: line.container
        ? {
            ...line.container,
            unitPrice: coerceMoney(line.container.unitPrice),
          }
        : line.container,
      components: line.components.map((component) => ({
        ...component,
        unitPrice: coerceMoney(component.unitPrice),
      })),
    },
  };
}

export function sanitizeStoredCartLines(
  lines: StoredCartLine[],
): StoredCartLine[] {
  return lines.map(sanitizeStoredCartLine);
}

export function applyServerCartPricing(
  stored: StoredCartLine[],
  serverLines: OrderShoppingCartLine[],
): StoredCartLine[] {
  if (stored.length !== serverLines.length) return stored;

  return stored.map((entry, index) => {
    const server = serverLines[index];
    if (!server || entry.line.type !== server.type) return entry;

    if (entry.line.type === "product" && server.type === "product") {
      if (
        entry.line.unitPrice === server.unitPrice &&
        entry.line.lineTotal === server.lineTotal
      ) {
        return entry;
      }

      return {
        ...entry,
        line: {
          ...entry.line,
          unitPrice: coerceMoney(server.unitPrice),
          lineTotal: coerceMoney(server.lineTotal),
        },
      };
    }

    if (entry.line.type === "bundle" && server.type === "bundle") {
      const bundleLine = entry.line;
      if (bundleLine.lineTotal === server.lineTotal) return entry;

      return {
        ...entry,
        line: {
          ...bundleLine,
          lineTotal: coerceMoney(server.lineTotal),
          components: server.components.map((component, componentIndex) => {
            const existing = bundleLine.components[componentIndex];
            return existing
              ? {
                  ...existing,
                  unitPrice: coerceMoney(component.unitPrice),
                  totalQuantity: component.totalQuantity,
                }
              : {
                  ...component,
                  unitPrice: coerceMoney(component.unitPrice),
                };
          }),
          container: server.container
            ? {
                ...server.container,
                unitPrice: coerceMoney(server.container.unitPrice),
              }
            : bundleLine.container,
        },
      };
    }

    return entry;
  });
}

function cartPricingChanged(
  stored: StoredCartLine[],
  serverLines: OrderShoppingCartLine[],
): boolean {
  const next = applyServerCartPricing(stored, serverLines);
  return next.some(
    (entry, index) =>
      entry.line.lineTotal !== stored[index]?.line.lineTotal ||
      (entry.line.type === "product" &&
        stored[index]?.line.type === "product" &&
        entry.line.unitPrice !== stored[index].line.unitPrice),
  );
}

export function shouldSyncCartPricing(
  stored: StoredCartLine[],
  serverLines: OrderShoppingCartLine[],
): boolean {
  return cartPricingChanged(stored, serverLines);
}

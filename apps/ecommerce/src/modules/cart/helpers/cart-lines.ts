import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import {
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
} from "@de-tin-marin/shared/product-purchase-limits";
import type {
  PublicPackListItem,
  PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
import type {
  OrderShoppingCartBundleLine,
  OrderShoppingCartLine,
  OrderShoppingCartPackLine,
  OrderShoppingCartProductLine,
} from "@de-tin-marin/shared/order-cart";
import { getBundleLineChargeableTotal } from "@de-tin-marin/shared/order-cart";
import { coerceMoney, roundMoney } from "@de-tin-marin/shared/prices";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { resolvePackPurchaseLimits } from "@/modules/catalog/components/pack-detail-page/pack-detail-page.helpers";
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
  const packagePrice = roundMoney(product.finalPrice);
  const itemsPerPackage = Math.max(1, product.itemsPerPackage);
  const unitPrice = roundMoney(packagePrice / itemsPerPackage);
  return {
    type: "product",
    productId: product.id,
    sku: product.sku,
    name: product.name,
    packageQuantity: safeQuantity,
    unitQuantity: 0,
    packagePrice,
    unitPrice,
    lineTotal: roundMoney(packagePrice * safeQuantity),
    imageUrl: normalizeCartImageUrl(product.imageUrl),
  };
}

export function createPackCartLine(
  pack: PublicPackListItem,
  quantity = pack.purchaseMinQuantity,
): OrderShoppingCartPackLine {
  const bounds = resolvePackPurchaseLimits(pack);
  const safeQuantity = clampProductPurchaseQuantity(quantity, bounds);
  const unitPrice = roundMoney(pack.finalPrice);
  return {
    type: "pack",
    packId: pack.id,
    sku: pack.sku,
    name: pack.name,
    quantity: safeQuantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * safeQuantity),
    components: [],
    imageUrl: normalizeCartImageUrl(pack.imageUrl),
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

export function mergePackCartLine(
  lines: StoredCartLine[],
  line: OrderShoppingCartPackLine,
  bounds: ProductPurchaseBounds,
): StoredCartLine[] {
  if (!bounds.purchasable) return lines;

  const existing = lines.find(
    (entry) => entry.line.type === "pack" && entry.line.packId === line.packId,
  );

  if (!existing || existing.line.type !== "pack") {
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
    const packageQuantity = clampProductPurchaseQuantity(
      line.packageQuantity,
      bounds,
    );
    return [
      ...lines,
      {
        cartLineId: crypto.randomUUID(),
        line: {
          ...line,
          packageQuantity,
          unitQuantity: 0,
          lineTotal: roundMoney(line.packagePrice * packageQuantity),
        },
      },
    ];
  }

  const nextQuantity = mergeProductPurchaseQuantity(
    existing.line.packageQuantity,
    line.packageQuantity,
    bounds,
  );
  const packagePrice = existing.line.packagePrice;

  return lines.map((entry) =>
    entry.cartLineId === existing.cartLineId
      ? {
          ...entry,
          line: {
            ...existing.line,
            packageQuantity: nextQuantity,
            unitQuantity: 0,
            lineTotal: roundMoney(packagePrice * nextQuantity),
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
    if (entry.cartLineId !== cartLineId) return entry;

    if (entry.line.type === "product") {
      return {
        ...entry,
        line: {
          ...entry.line,
          packageQuantity: nextQuantity,
          unitQuantity: 0,
          lineTotal: roundMoney(entry.line.packagePrice * nextQuantity),
        },
      };
    }

    if (entry.line.type === "pack") {
      return {
        ...entry,
        line: {
          ...entry.line,
          quantity: nextQuantity,
          lineTotal: roundMoney(entry.line.unitPrice * nextQuantity),
        },
      };
    }

    return entry;
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
    const packagePrice = coerceMoney(line.packagePrice);
    const unitPrice = coerceMoney(line.unitPrice);
    const packageQuantity =
      typeof line.packageQuantity === "number" && line.packageQuantity > 0
        ? line.packageQuantity
        : 1;

    return {
      ...entry,
      line: {
        ...line,
        packageQuantity,
        unitQuantity: 0,
        packagePrice,
        unitPrice,
        lineTotal: roundMoney(packagePrice * packageQuantity),
      },
    };
  }

  if (line.type === "pack") {
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
        components: Array.isArray(line.components) ? line.components : [],
      },
    };
  }

  return {
    ...entry,
    line: {
      ...line,
      lineTotal: coerceMoney(line.lineTotal),
      normalizedPerSurprisePrice: coerceMoney(line.normalizedPerSurprisePrice),
      normalizedLineTotal: coerceMoney(line.normalizedLineTotal),
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
        entry.line.packagePrice === server.packagePrice &&
        entry.line.unitPrice === server.unitPrice &&
        entry.line.packageQuantity === server.packageQuantity &&
        entry.line.unitQuantity === server.unitQuantity &&
        entry.line.lineTotal === server.lineTotal
      ) {
        return entry;
      }

      return {
        ...entry,
        line: {
          ...entry.line,
          packageQuantity: server.packageQuantity,
          unitQuantity: server.unitQuantity,
          packagePrice: coerceMoney(server.packagePrice),
          unitPrice: coerceMoney(server.unitPrice),
          lineTotal: coerceMoney(server.lineTotal),
        },
      };
    }

    if (entry.line.type === "pack" && server.type === "pack") {
      if (
        entry.line.unitPrice === server.unitPrice &&
        entry.line.lineTotal === server.lineTotal &&
        entry.line.components.length === server.components.length
      ) {
        return entry;
      }

      return {
        ...entry,
        line: {
          ...entry.line,
          unitPrice: coerceMoney(server.unitPrice),
          lineTotal: coerceMoney(server.lineTotal),
          components: server.components,
          imageUrl: entry.line.imageUrl ?? server.imageUrl,
        },
      };
    }

    if (entry.line.type === "bundle" && server.type === "bundle") {
      const bundleLine = entry.line;
      if (
        bundleLine.lineTotal === server.lineTotal &&
        bundleLine.normalizedPerSurprisePrice ===
          server.normalizedPerSurprisePrice &&
        bundleLine.normalizedLineTotal === server.normalizedLineTotal
      ) {
        return entry;
      }

      return {
        ...entry,
        line: {
          ...bundleLine,
          lineTotal: coerceMoney(server.lineTotal),
          normalizedPerSurprisePrice: coerceMoney(
            server.normalizedPerSurprisePrice,
          ),
          normalizedLineTotal: coerceMoney(server.normalizedLineTotal),
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
  return next.some((entry, index) => {
    const previous = stored[index];
    if (!previous) return true;
    if (
      entry.line.type === "bundle" &&
      previous.line.type === "bundle" &&
      getBundleLineChargeableTotal(entry.line) !==
        getBundleLineChargeableTotal(previous.line)
    ) {
      return true;
    }
    if (entry.line.lineTotal !== previous.line.lineTotal) return true;
    if (
      (entry.line.type === "product" || entry.line.type === "pack") &&
      (previous.line.type === "product" || previous.line.type === "pack")
    ) {
      if (entry.line.type === "product" && previous.line.type === "product") {
        return (
          entry.line.packagePrice !== previous.line.packagePrice ||
          entry.line.unitPrice !== previous.line.unitPrice
        );
      }
      if (entry.line.type === "pack" && previous.line.type === "pack") {
        return entry.line.unitPrice !== previous.line.unitPrice;
      }
    }
    return false;
  });
}

export function shouldSyncCartPricing(
  stored: StoredCartLine[],
  serverLines: OrderShoppingCartLine[],
): boolean {
  return cartPricingChanged(stored, serverLines);
}

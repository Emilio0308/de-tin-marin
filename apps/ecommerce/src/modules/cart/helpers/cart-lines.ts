import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import {
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
} from "@de-tin-marin/shared/product-purchase-limits";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import type {
  OrderShoppingCartBundleLine,
  OrderShoppingCartProductLine,
} from "@de-tin-marin/shared/order-cart";
import { roundMoney } from "@de-tin-marin/shared/prices";
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

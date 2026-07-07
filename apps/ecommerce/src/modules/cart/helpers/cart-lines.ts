import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import type {
  OrderShoppingCartBundleLine,
  OrderShoppingCartProductLine,
} from "@de-tin-marin/shared/order-cart";
import { roundMoney } from "@de-tin-marin/shared/prices";
import type { StoredCartLine } from "../repositories/cart.repository";

export function createProductCartLine(
  product: PublicProductListItem,
  quantity = 1,
): OrderShoppingCartProductLine {
  const unitPrice = roundMoney(product.finalPrice);
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

export function mergeProductLine(
  lines: StoredCartLine[],
  product: PublicProductListItem,
): StoredCartLine[] {
  return mergeProductCartLine(lines, createProductCartLine(product));
}

export function mergeProductCartLine(
  lines: StoredCartLine[],
  line: OrderShoppingCartProductLine,
): StoredCartLine[] {
  const existing = lines.find(
    (entry) =>
      entry.line.type === "product" && entry.line.productId === line.productId,
  );

  if (!existing || existing.line.type !== "product") {
    return [
      ...lines,
      {
        cartLineId: crypto.randomUUID(),
        line,
      },
    ];
  }

  const nextQuantity = existing.line.quantity + line.quantity;
  const unitPrice = existing.line.unitPrice;

  return lines.map((entry) =>
    entry.cartLineId === existing.cartLineId
      ? {
          ...entry,
          line: {
            ...existing.line,
            quantity: nextQuantity,
            lineTotal: roundMoney(unitPrice * nextQuantity),
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
): StoredCartLine[] {
  if (quantity < 1) return lines;

  return lines.map((entry) => {
    if (entry.cartLineId !== cartLineId || entry.line.type !== "product") {
      return entry;
    }

    return {
      ...entry,
      line: {
        ...entry.line,
        quantity,
        lineTotal: roundMoney(entry.line.unitPrice * quantity),
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

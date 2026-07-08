import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";

export type StoredCartLine = {
  cartLineId: string;
  line: OrderShoppingCartLine;
};

export interface CartRepository {
  getLines(): StoredCartLine[];
  addLine(line: OrderShoppingCartLine): void;
  replaceLines(lines: StoredCartLine[]): void;
  updateProductQuantity(
    cartLineId: string,
    quantity: number,
    bounds: ProductPurchaseBounds,
  ): void;
  removeLine(cartLineId: string): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

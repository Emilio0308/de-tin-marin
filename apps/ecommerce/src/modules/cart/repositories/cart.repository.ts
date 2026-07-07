import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";

export type StoredCartLine = {
  cartLineId: string;
  line: OrderShoppingCartLine;
};

export interface CartRepository {
  getLines(): StoredCartLine[];
  addLine(line: OrderShoppingCartLine): void;
  replaceLines(lines: StoredCartLine[]): void;
  updateProductQuantity(cartLineId: string, quantity: number): void;
  removeLine(cartLineId: string): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

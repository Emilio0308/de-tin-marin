import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import type { CartRepository, StoredCartLine } from "./cart.repository";
import {
  addBundleCartLine,
  mergeProductCartLine,
  removeStoredCartLine,
  updateStoredProductQuantity,
} from "../helpers/cart-lines";

const STORAGE_KEY = "dtm-cart-lines";

function readLines(): StoredCartLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is StoredCartLine =>
        Boolean(entry) &&
        typeof entry === "object" &&
        "cartLineId" in entry &&
        "line" in entry,
    );
  } catch {
    return [];
  }
}

function writeLines(lines: StoredCartLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const localStorageCartRepository: CartRepository = {
  getLines() {
    return readLines();
  },

  addLine(line: OrderShoppingCartLine) {
    const current = readLines();
    const next =
      line.type === "product"
        ? mergeProductCartLine(current, line)
        : addBundleCartLine(current, line);
    writeLines(next);
    notify();
  },

  replaceLines(lines: StoredCartLine[]) {
    writeLines(lines);
    notify();
  },

  updateProductQuantity(cartLineId: string, quantity: number) {
    const next = updateStoredProductQuantity(readLines(), cartLineId, quantity);
    writeLines(next);
    notify();
  },

  removeLine(cartLineId: string) {
    const next = removeStoredCartLine(readLines(), cartLineId);
    writeLines(next);
    notify();
  },

  clear() {
    writeLines([]);
    notify();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

import type { OrderShoppingCartBundleLine } from "@de-tin-marin/shared/order-cart";

export type PendingCartBundleLine = OrderShoppingCartBundleLine;

const STORAGE_KEY = "dtm-pending-cart-lines";

function readLines(): PendingCartBundleLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is PendingCartBundleLine =>
        Boolean(line) &&
        typeof line === "object" &&
        "type" in line &&
        (line as { type: string }).type === "bundle",
    );
  } catch {
    return [];
  }
}

export function getPendingCartLines(): PendingCartBundleLine[] {
  return readLines();
}

export function savePendingCartLine(line: PendingCartBundleLine): void {
  if (typeof window === "undefined") return;
  const lines = readLines();
  lines.push(line);
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function clearPendingCartLines(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

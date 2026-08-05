import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Node 25+ ships an experimental Web Storage stub that can shadow jsdom's
 * Storage when --no-webstorage is not applied. Install an in-memory fallback
 * if localStorage is missing or unusable.
 */
function ensureMemoryLocalStorage(): void {
  if (typeof window === "undefined") return;

  const candidate = window.localStorage;
  if (candidate && typeof candidate.getItem === "function") return;

  const data = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? (data.get(key) ?? null) : null;
    },
    setItem(key: string, value: string) {
      data.set(key, String(value));
    },
    removeItem(key: string) {
      data.delete(key);
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
  };

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: memoryStorage,
  });
}

ensureMemoryLocalStorage();

afterEach(() => {
  cleanup();
});

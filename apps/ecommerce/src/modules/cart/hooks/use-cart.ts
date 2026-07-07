"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import type { OrderShoppingCartBundleLine } from "@de-tin-marin/shared/order-cart";
import { computeOrderTotals } from "@de-tin-marin/shared/order-cart";
import {
  clearPendingCartLines,
  getPendingCartLines,
} from "@/modules/bundle-wizard/helpers/pending-cart";
import {
  addBundleCartLine,
  createProductCartLine,
  mergeProductLine,
  toShoppingCartLines,
} from "../helpers/cart-lines";
import type { StoredCartLine } from "../repositories/cart.repository";
import { localStorageCartRepository } from "../repositories/local-storage-cart.repository";

let migratedPendingLines = false;

function migratePendingWizardLines(repository = localStorageCartRepository) {
  if (migratedPendingLines || typeof window === "undefined") return;
  migratedPendingLines = true;

  const pendingLines = getPendingCartLines();
  if (pendingLines.length === 0) return;

  let current = repository.getLines();
  for (const line of pendingLines) {
    current = addBundleCartLine(current, line);
  }
  repository.replaceLines(current);
  clearPendingCartLines();
}

export function useCart() {
  const [lines, setLines] = useState<StoredCartLine[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    migratePendingWizardLines();
    setLines(localStorageCartRepository.getLines());
    setIsReady(true);
    return localStorageCartRepository.subscribe(() => {
      setLines(localStorageCartRepository.getLines());
    });
  }, []);

  const totals = useMemo(
    () => computeOrderTotals({ lines: toShoppingCartLines(lines) }),
    [lines],
  );

  const itemCount = useMemo(() => lines.length, [lines]);

  const addProduct = useCallback((product: PublicProductListItem) => {
    const next = mergeProductLine(
      localStorageCartRepository.getLines(),
      product,
    );
    localStorageCartRepository.replaceLines(next);
  }, []);

  const addBundleLine = useCallback((line: OrderShoppingCartBundleLine) => {
    const next = addBundleCartLine(localStorageCartRepository.getLines(), line);
    localStorageCartRepository.replaceLines(next);
  }, []);

  const updateProductQuantity = useCallback(
    (cartLineId: string, quantity: number) => {
      localStorageCartRepository.updateProductQuantity(cartLineId, quantity);
    },
    [],
  );

  const removeLine = useCallback((cartLineId: string) => {
    localStorageCartRepository.removeLine(cartLineId);
  }, []);

  const clear = useCallback(() => {
    localStorageCartRepository.clear();
  }, []);

  return {
    lines,
    isReady,
    totals,
    itemCount,
    addProduct,
    addBundleLine,
    updateProductQuantity,
    removeLine,
    clear,
    migratePendingWizardLines,
  };
}

export function buildProductLineForCart(product: PublicProductListItem) {
  return createProductCartLine(product);
}

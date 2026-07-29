"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PublicPackListItem,
  PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import type { OrderShoppingCartBundleLine } from "@de-tin-marin/shared/order-cart";
import { computeOrderTotals } from "@de-tin-marin/shared/order-cart";
import {
  clearPendingCartLines,
  getPendingCartLines,
} from "@/modules/bundle-wizard/helpers/pending-cart";
import { resolvePackPurchaseLimits } from "@/modules/catalog/components/pack-detail-page/pack-detail-page.helpers";
import { resolveProductPurchaseLimits } from "@/modules/catalog/helpers/product-purchase-limits";
import {
  addBundleCartLine,
  createPackCartLine,
  createProductCartLine,
  mergePackCartLine,
  mergeProductCartLine,
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

  const addProduct = useCallback(
    (product: PublicProductListItem, quantity?: number) => {
      const bounds = resolveProductPurchaseLimits(product);
      if (!bounds.purchasable) return;

      const line = createProductCartLine(
        product,
        quantity ?? product.purchaseMinQuantity,
      );
      const next = mergeProductCartLine(
        localStorageCartRepository.getLines(),
        line,
        bounds,
      );
      localStorageCartRepository.replaceLines(next);
    },
    [],
  );

  const addPack = useCallback((pack: PublicPackListItem, quantity?: number) => {
    const bounds = resolvePackPurchaseLimits(pack);
    if (!bounds.purchasable) return;

    const line = createPackCartLine(pack, quantity ?? pack.purchaseMinQuantity);
    const next = mergePackCartLine(
      localStorageCartRepository.getLines(),
      line,
      bounds,
    );
    localStorageCartRepository.replaceLines(next);
  }, []);

  const addBundleLine = useCallback((line: OrderShoppingCartBundleLine) => {
    const next = addBundleCartLine(localStorageCartRepository.getLines(), line);
    localStorageCartRepository.replaceLines(next);
  }, []);

  const updateProductQuantity = useCallback(
    (cartLineId: string, quantity: number, bounds: ProductPurchaseBounds) => {
      localStorageCartRepository.updateProductQuantity(
        cartLineId,
        quantity,
        bounds,
      );
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
    addPack,
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

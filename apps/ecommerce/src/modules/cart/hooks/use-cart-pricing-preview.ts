"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { previewGuestOrderCartAction } from "@/modules/checkout/actions/preview-guest-order-cart";
import { cartCheckoutPreviewOptions } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import { cartLinesToOrderInput } from "../helpers/cart-to-order-input";
import {
  applyServerCartPricing,
  shouldSyncCartPricing,
} from "../helpers/cart-lines";
import type { StoredCartLine } from "../repositories/cart.repository";
import { localStorageCartRepository } from "../repositories/local-storage-cart.repository";

export function useCartPricingPreview(lines: StoredCartLine[]) {
  const orderInput = useMemo(() => cartLinesToOrderInput(lines), [lines]);

  const pricingQuery = useQuery({
    ...cartCheckoutPreviewOptions,
    queryKey: queryKeys.cart.pricing(orderInput),
    queryFn: async () => {
      const result = await previewGuestOrderCartAction({
        lines: orderInput,
        shippingTotal: 0,
        discountTotal: 0,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: lines.length > 0,
  });

  useEffect(() => {
    if (!pricingQuery.data?.lines.length) return;
    if (!shouldSyncCartPricing(lines, pricingQuery.data.lines)) return;

    localStorageCartRepository.replaceLines(
      applyServerCartPricing(lines, pricingQuery.data.lines),
    );
  }, [lines, pricingQuery.data]);

  const previewSubtotal = pricingQuery.data?.subtotal;
  const subtotal =
    typeof previewSubtotal === "number" && Number.isFinite(previewSubtotal)
      ? previewSubtotal
      : undefined;

  return {
    subtotal,
    isPricingPending:
      lines.length > 0 && (pricingQuery.isLoading || pricingQuery.isFetching),
    isPricingError: pricingQuery.isError,
    refetchPricing: pricingQuery.refetch,
  };
}

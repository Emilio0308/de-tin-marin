"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getPublicBundleAction } from "@/modules/catalog/actions/get-public-bundle";
import { getPublicProductAction } from "@/modules/catalog/actions/get-public-product";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { checkCartStockAction } from "@/modules/checkout/actions/check-cart-stock";
import { formatStockShortageMessages } from "@/shared/components/stock-banner/stock-banner";
import { queryKeys } from "@/shared/query/query-keys";
import { toShoppingCartLines } from "../../helpers/cart-lines";
import { useCart } from "../../hooks/use-cart";
import type { StoredCartLine } from "../../repositories/cart.repository";
import { CartPage } from "./cart-page";

function resolveStoredLineImageUrl(
  line: StoredCartLine["line"],
): string | null {
  if (line.imageUrl && line.imageUrl.trim() !== "") {
    return line.imageUrl;
  }
  return null;
}

async function fetchMissingCartLineImages(
  lines: StoredCartLine[],
): Promise<Record<string, string>> {
  const images: Record<string, string> = {};

  await Promise.all(
    lines.map(async (entry) => {
      if (resolveStoredLineImageUrl(entry.line)) return;

      if (entry.line.type === "product") {
        const result = await getPublicProductAction({
          id: entry.line.productId,
        });
        images[entry.cartLineId] =
          result.ok && result.data.imageUrl
            ? result.data.imageUrl
            : CATALOG_PLACEHOLDER_IMAGE;
        return;
      }

      const result = await getPublicBundleAction({ id: entry.line.bundleId });
      images[entry.cartLineId] =
        result.ok && result.data.imageUrl
          ? result.data.imageUrl
          : CATALOG_PLACEHOLDER_IMAGE;
    }),
  );

  return images;
}

export function CartPageContainer() {
  const t = useTranslations("cart");
  const { lines, totals, updateProductQuantity, removeLine } = useCart();

  const missingImageLineIds = useMemo(
    () =>
      lines
        .filter((entry) => !resolveStoredLineImageUrl(entry.line))
        .map((entry) => entry.cartLineId),
    [lines],
  );

  const imagesQuery = useQuery({
    queryKey: queryKeys.cart.lineImages(missingImageLineIds),
    queryFn: () => fetchMissingCartLineImages(lines),
    enabled: missingImageLineIds.length > 0,
  });

  const lineImageUrlByCartLineId = useMemo(() => {
    const resolved: Record<string, string> = {};

    for (const entry of lines) {
      const stored = resolveStoredLineImageUrl(entry.line);
      resolved[entry.cartLineId] =
        stored ??
        imagesQuery.data?.[entry.cartLineId] ??
        CATALOG_PLACEHOLDER_IMAGE;
    }

    return resolved;
  }, [imagesQuery.data, lines]);

  const stockQuery = useQuery({
    queryKey: queryKeys.checkout.stock(toShoppingCartLines(lines)),
    queryFn: async () => {
      const result = await checkCartStockAction({
        lines: toShoppingCartLines(lines),
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: lines.length > 0,
  });

  const stockMessages = formatStockShortageMessages(stockQuery.data, {
    product: t("stockProduct"),
    container: t("stockContainer"),
  });

  return (
    <CartPage
      lines={lines}
      subtotal={totals.subtotal}
      lineImageUrlByCartLineId={lineImageUrlByCartLineId}
      isStockPending={stockQuery.isLoading || stockQuery.isFetching}
      stockWarning={Boolean(stockQuery.data && !stockQuery.data.ok)}
      stockMessages={stockMessages}
      formatBundlePersons={(count) => t("bundlePersons", { count })}
      labels={{
        title: t("title"),
        empty: t("empty"),
        continueShopping: t("continueShopping"),
        checkout: t("checkout"),
        remove: t("remove"),
        subtotal: t("subtotal"),
        unitPriceSuffix: t("unitPriceSuffix"),
        decreaseQuantity: t("decreaseQuantity"),
        increaseQuantity: t("increaseQuantity"),
        components: t("components"),
        stockTitle: t("stockTitle"),
        stockChecking: t("stockChecking"),
        stockProduct: t("stockProduct"),
        stockContainer: t("stockContainer"),
        bundleBadge: t("bundleBadge"),
      }}
      onUpdateQuantity={updateProductQuantity}
      onRemove={removeLine}
    />
  );
}

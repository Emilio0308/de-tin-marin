"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import { getPublicBundleAction } from "@/modules/catalog/actions/get-public-bundle";
import { getPublicProductAction } from "@/modules/catalog/actions/get-public-product";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { resolveProductPurchaseLimits } from "@/modules/catalog/helpers/product-purchase-limits";
import { checkCartStockAction } from "@/modules/checkout/actions/check-cart-stock";
import { formatStockShortageMessages } from "@/shared/components/stock-banner/stock-banner";
import { queryKeys } from "@/shared/query/query-keys";
import { freshQueryOptions } from "@/shared/query/query-cache";
import { toShoppingCartLines } from "../../helpers/cart-lines";
import { useCart } from "../../hooks/use-cart";
import { useCartPricingPreview } from "../../hooks/use-cart-pricing-preview";
import type { StoredCartLine } from "../../repositories/cart.repository";
import { CartPage } from "./cart-page";

type CartProductLineMeta = {
  imageUrl?: string;
  bounds: ProductPurchaseBounds;
};

function resolveStoredLineImageUrl(
  line: StoredCartLine["line"],
): string | null {
  if (line.imageUrl && line.imageUrl.trim() !== "") {
    return line.imageUrl;
  }
  return null;
}

async function fetchCartProductMetadata(
  lines: StoredCartLine[],
): Promise<Record<string, CartProductLineMeta>> {
  const meta: Record<string, CartProductLineMeta> = {};

  await Promise.all(
    lines.map(async (entry) => {
      if (entry.line.type !== "product") return;

      const result = await getPublicProductAction({
        id: entry.line.productId,
      });

      if (result.ok) {
        meta[entry.cartLineId] = {
          imageUrl: result.data.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
          bounds: resolveProductPurchaseLimits(result.data),
        };
        return;
      }

      meta[entry.cartLineId] = {
        bounds: {
          minQuantity: 1,
          maxQuantity: entry.line.quantity,
          purchasable: false,
        },
      };
    }),
  );

  return meta;
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
  const { subtotal: previewSubtotal } = useCartPricingPreview(lines);
  const subtotal = previewSubtotal ?? totals.subtotal ?? 0;

  const productLineIds = useMemo(
    () =>
      lines
        .filter((entry) => entry.line.type === "product")
        .map((entry) => entry.cartLineId),
    [lines],
  );

  const productMetaQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.cart.productMeta(productLineIds),
    queryFn: () => fetchCartProductMetadata(lines),
    enabled: productLineIds.length > 0,
  });

  const missingImageLineIds = useMemo(
    () =>
      lines
        .filter((entry) => !resolveStoredLineImageUrl(entry.line))
        .map((entry) => entry.cartLineId),
    [lines],
  );

  const imagesQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.cart.lineImages(missingImageLineIds),
    queryFn: () => fetchMissingCartLineImages(lines),
    enabled: missingImageLineIds.length > 0,
  });

  const lineImageUrlByCartLineId = useMemo(() => {
    const resolved: Record<string, string> = {};

    for (const entry of lines) {
      const stored = resolveStoredLineImageUrl(entry.line);
      const fromProductMeta =
        productMetaQuery.data?.[entry.cartLineId]?.imageUrl;
      resolved[entry.cartLineId] =
        stored ??
        fromProductMeta ??
        imagesQuery.data?.[entry.cartLineId] ??
        CATALOG_PLACEHOLDER_IMAGE;
    }

    return resolved;
  }, [imagesQuery.data, lines, productMetaQuery.data]);

  const productBoundsByCartLineId = useMemo(() => {
    const bounds: Record<string, ProductPurchaseBounds> = {};

    for (const entry of lines) {
      if (entry.line.type !== "product") continue;
      bounds[entry.cartLineId] = productMetaQuery.data?.[entry.cartLineId]
        ?.bounds ?? {
        minQuantity: 1,
        maxQuantity: entry.line.quantity,
        purchasable: true,
      };
    }

    return bounds;
  }, [lines, productMetaQuery.data]);

  const stockQuery = useQuery({
    ...freshQueryOptions,
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
      subtotal={subtotal}
      lineImageUrlByCartLineId={lineImageUrlByCartLineId}
      productBoundsByCartLineId={productBoundsByCartLineId}
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

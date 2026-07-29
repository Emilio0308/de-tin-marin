"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import { getPublicBundleAction } from "@/modules/catalog/actions/get-public-bundle";
import { getPublicPackAction } from "@/modules/catalog/actions/get-public-pack";
import { getPublicProductAction } from "@/modules/catalog/actions/get-public-product";
import { resolvePackPurchaseLimits } from "@/modules/catalog/components/pack-detail-page/pack-detail-page.helpers";
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

type CartQuantityLineMeta = {
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

async function fetchCartQuantityMetadata(
  lines: StoredCartLine[],
): Promise<Record<string, CartQuantityLineMeta>> {
  const meta: Record<string, CartQuantityLineMeta> = {};

  await Promise.all(
    lines.map(async (entry) => {
      if (entry.line.type === "product") {
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
        return;
      }

      if (entry.line.type === "pack") {
        const result = await getPublicPackAction({ id: entry.line.packId });

        if (result.ok) {
          meta[entry.cartLineId] = {
            imageUrl: result.data.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
            bounds: resolvePackPurchaseLimits(result.data),
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
      }
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

      if (entry.line.type === "pack") {
        const result = await getPublicPackAction({ id: entry.line.packId });
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

  const quantityLineIds = useMemo(
    () =>
      lines
        .filter(
          (entry) =>
            entry.line.type === "product" || entry.line.type === "pack",
        )
        .map((entry) => entry.cartLineId),
    [lines],
  );

  const quantityMetaQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.cart.productMeta(quantityLineIds),
    queryFn: () => fetchCartQuantityMetadata(lines),
    enabled: quantityLineIds.length > 0,
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
      const fromMeta = quantityMetaQuery.data?.[entry.cartLineId]?.imageUrl;
      resolved[entry.cartLineId] =
        stored ??
        fromMeta ??
        imagesQuery.data?.[entry.cartLineId] ??
        CATALOG_PLACEHOLDER_IMAGE;
    }

    return resolved;
  }, [imagesQuery.data, lines, quantityMetaQuery.data]);

  const productBoundsByCartLineId = useMemo(() => {
    const bounds: Record<string, ProductPurchaseBounds> = {};

    for (const entry of lines) {
      if (entry.line.type !== "product" && entry.line.type !== "pack") {
        continue;
      }
      bounds[entry.cartLineId] = quantityMetaQuery.data?.[entry.cartLineId]
        ?.bounds ?? {
        minQuantity: 1,
        maxQuantity: entry.line.quantity,
        purchasable: true,
      };
    }

    return bounds;
  }, [lines, quantityMetaQuery.data]);

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
        packComponents: t("packComponents"),
        stockTitle: t("stockTitle"),
        stockChecking: t("stockChecking"),
        stockProduct: t("stockProduct"),
        stockContainer: t("stockContainer"),
        bundleBadge: t("bundleBadge"),
        packBadge: t("packBadge"),
      }}
      onUpdateQuantity={updateProductQuantity}
      onRemove={removeLine}
    />
  );
}

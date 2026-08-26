"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import { getCartLineMetaAction } from "@/modules/catalog/actions/get-cart-line-meta";
import { getPublicBundleAction } from "@/modules/catalog/actions/get-public-bundle";
import { resolvePackPurchaseLimits } from "@/modules/catalog/components/pack-detail-page/pack-detail-page.helpers";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { resolveProductPurchaseLimits } from "@/modules/catalog/helpers/product-purchase-limits";
import { checkCartStockAction } from "@/modules/checkout/actions/check-cart-stock";
import { formatStockShortageMessages } from "@/shared/components/stock-banner/stock-banner";
import { queryKeys } from "@/shared/query/query-keys";
import { freshQueryOptions } from "@/shared/query/query-cache";
import {
  applyServerCartPricing,
  toShoppingCartLines,
} from "../../helpers/cart-lines";
import {
  clearCartSyncPayload,
  purgeCartLinesByStockAndBounds,
  readCartSyncPayload,
} from "../../helpers/cart-sync";
import { useCart } from "../../hooks/use-cart";
import { useCartPricingPreview } from "../../hooks/use-cart-pricing-preview";
import { localStorageCartRepository } from "../../repositories/local-storage-cart.repository";
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

async function fetchMissingCartLineImages(
  lines: StoredCartLine[],
): Promise<Record<string, string>> {
  const images: Record<string, string> = {};

  await Promise.all(
    lines.map(async (entry) => {
      if (resolveStoredLineImageUrl(entry.line)) return;
      if (entry.line.type !== "bundle") return;

      const result = await getPublicBundleAction({ id: entry.line.bundleId });
      images[entry.cartLineId] =
        result.ok && result.data.imageUrl
          ? result.data.imageUrl
          : CATALOG_PLACEHOLDER_IMAGE;
    }),
  );

  return images;
}

function showCartSyncToast(
  t: ReturnType<typeof useTranslations<"cart">>,
  priceChanged: boolean,
  stockChanged: boolean,
) {
  if (priceChanged && stockChanged) {
    toast.message(t("sync.priceAndStock"));
    return;
  }
  if (priceChanged) {
    toast.message(t("sync.priceUpdated"));
    return;
  }
  if (stockChanged) {
    toast.message(t("sync.stockRemoved"));
  }
}

export function CartPageContainer() {
  const t = useTranslations("cart");
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncHandledRef = useRef(false);
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

  const productIds = useMemo(
    () => [
      ...new Set(
        lines.flatMap((entry) =>
          entry.line.type === "product" ? [entry.line.productId] : [],
        ),
      ),
    ],
    [lines],
  );

  const packIds = useMemo(
    () => [
      ...new Set(
        lines.flatMap((entry) =>
          entry.line.type === "pack" ? [entry.line.packId] : [],
        ),
      ),
    ],
    [lines],
  );

  const quantityMetaQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.cart.productMeta(quantityLineIds),
    queryFn: async () => {
      const result = await getCartLineMetaAction({ productIds, packIds });
      if (!result.ok) throw new Error(result.error);

      const productsById = new Map(
        result.data.products.map((product) => [product.id, product]),
      );
      const packsById = new Map(
        result.data.packs.map((pack) => [pack.id, pack]),
      );
      const meta: Record<string, CartQuantityLineMeta> = {};

      for (const entry of lines) {
        if (entry.line.type === "product") {
          const product = productsById.get(entry.line.productId);
          if (product) {
            meta[entry.cartLineId] = {
              imageUrl: product.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
              bounds: resolveProductPurchaseLimits(product),
            };
          } else {
            meta[entry.cartLineId] = {
              bounds: {
                minQuantity: 1,
                maxQuantity: entry.line.packageQuantity,
                purchasable: false,
              },
            };
          }
          continue;
        }

        if (entry.line.type === "pack") {
          const pack = packsById.get(entry.line.packId);
          if (pack) {
            meta[entry.cartLineId] = {
              imageUrl: pack.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
              bounds: resolvePackPurchaseLimits(pack),
            };
          } else {
            meta[entry.cartLineId] = {
              bounds: {
                minQuantity: 1,
                maxQuantity: entry.line.quantity,
                purchasable: false,
              },
            };
          }
        }
      }

      return meta;
    },
    enabled: quantityLineIds.length > 0,
  });

  const missingImageLineIds = useMemo(
    () =>
      lines
        .filter(
          (entry) =>
            entry.line.type === "bundle" &&
            !resolveStoredLineImageUrl(entry.line),
        )
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
        maxQuantity:
          entry.line.type === "product"
            ? entry.line.packageQuantity
            : entry.line.quantity,
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

  useEffect(() => {
    if (syncHandledRef.current) return;
    if (searchParams.get("sync") !== "1") return;

    syncHandledRef.current = true;
    const payload = readCartSyncPayload();
    clearCartSyncPayload();

    if (payload) {
      const current = localStorageCartRepository.getLines();
      const priced = applyServerCartPricing(current, payload.lines);
      const emptyBounds: Record<string, ProductPurchaseBounds> = {};
      for (const entry of priced) {
        if (entry.line.type === "product" || entry.line.type === "pack") {
          emptyBounds[entry.cartLineId] = {
            minQuantity: 1,
            maxQuantity:
              entry.line.type === "product"
                ? entry.line.packageQuantity
                : entry.line.quantity,
            purchasable: true,
          };
        }
      }
      const purged = purgeCartLinesByStockAndBounds(
        priced,
        payload.stock,
        emptyBounds,
      );
      localStorageCartRepository.replaceLines(purged.lines);
      showCartSyncToast(
        t,
        payload.priceChanged,
        payload.stockChanged || purged.removedCount > 0,
      );
    }

    router.replace("/carrito", { scroll: false });
  }, [router, searchParams, t]);

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
        subtitle: t("subtitle"),
        empty: t("empty"),
        emptyHint: t("emptyHint"),
        continueShopping: t("continueShopping"),
        checkout: t("checkout"),
        remove: t("remove"),
        subtotal: t("subtotal"),
        summaryTitle: t("summaryTitle"),
        itemCount: t("itemCount", { count: lines.length }),
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
        stepsLabel: t("steps.label"),
        stepCart: t("steps.cart"),
        stepCheckout: t("steps.checkout"),
        stepDone: t("steps.done"),
      }}
      onUpdateQuantity={updateProductQuantity}
      onRemove={removeLine}
    />
  );
}

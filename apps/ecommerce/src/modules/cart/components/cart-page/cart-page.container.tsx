"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { checkCartStockAction } from "@/modules/checkout/actions/check-cart-stock";
import { queryKeys } from "@/shared/query/query-keys";
import { toShoppingCartLines } from "../../helpers/cart-lines";
import { useCart } from "../../hooks/use-cart";
import { CartPage } from "./cart-page";

export function CartPageContainer() {
  const t = useTranslations("cart");
  const { lines, totals, updateProductQuantity, removeLine } = useCart();

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

  const stockMessages =
    stockQuery.data && !stockQuery.data.ok
      ? stockQuery.data.shortages.map(
          (shortage) =>
            `${shortage.kind === "product" ? t("stockProduct") : t("stockContainer")} ${shortage.name ?? shortage.sku}: ${shortage.available}/${shortage.required}`,
        )
      : [];

  return (
    <CartPage
      lines={lines}
      subtotal={totals.subtotal}
      stockWarning={Boolean(stockQuery.data && !stockQuery.data.ok)}
      stockMessages={stockMessages}
      formatBundlePersons={(count) => t("bundlePersons", { count })}
      labels={{
        title: t("title"),
        empty: t("empty"),
        checkout: t("checkout"),
        remove: t("remove"),
        subtotal: t("subtotal"),
        quantity: t("quantity"),
        components: t("components"),
        stockTitle: t("stockTitle"),
        stockProduct: t("stockProduct"),
        stockContainer: t("stockContainer"),
      }}
      onUpdateQuantity={updateProductQuantity}
      onRemove={removeLine}
    />
  );
}

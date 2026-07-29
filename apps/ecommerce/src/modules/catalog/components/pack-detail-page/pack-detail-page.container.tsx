"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicPackDetail } from "@de-tin-marin/validations/public-catalog";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { resolvePackPurchaseLimits } from "./pack-detail-page.helpers";
import { PackDetailPage } from "./pack-detail-page";
import type { PackDetailStaticLabels } from "./pack-detail-page.types";

export type PackDetailPageContainerProps = {
  pack: PublicPackDetail;
  labels: PackDetailStaticLabels;
};

export function PackDetailPageContainer({
  pack,
  labels,
}: PackDetailPageContainerProps) {
  const t = useTranslations("catalog");
  const { addPack } = useCart();
  const bounds = useMemo(() => resolvePackPurchaseLimits(pack), [pack]);
  const [quantity, setQuantity] = useState(bounds.minQuantity);

  const pageLabels = useMemo(
    () => ({
      ...labels,
      formatComponentPackages: (packages: number, units: number) =>
        t("packs.componentPackages", { packages, units }),
      formatComponentUnits: (count: number) =>
        t("packs.componentUnits", { count }),
    }),
    [labels, t],
  );

  function handleDecreaseQuantity() {
    setQuantity((current) => Math.max(bounds.minQuantity, current - 1));
  }

  function handleIncreaseQuantity() {
    setQuantity((current) => Math.min(bounds.maxQuantity, current + 1));
  }

  function handleAddToCart() {
    if (!bounds.purchasable) return;
    addPack(pack, quantity);
    setQuantity(bounds.minQuantity);
  }

  return (
    <PackDetailPage
      pack={pack}
      labels={pageLabels}
      quantity={quantity}
      minQuantity={bounds.minQuantity}
      maxQuantity={bounds.maxQuantity}
      purchasable={bounds.purchasable}
      onDecreaseQuantity={handleDecreaseQuantity}
      onIncreaseQuantity={handleIncreaseQuantity}
      onAddToCart={bounds.purchasable ? handleAddToCart : undefined}
    />
  );
}

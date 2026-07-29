import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicPackAction } from "@/modules/catalog/actions/get-public-pack";
import { PackDetailPageContainer } from "@/modules/catalog/components/pack-detail-page/pack-detail-page.container";

type PackDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function PackDetailRoute({
  params,
}: PackDetailRouteProps) {
  const { slug } = await params;
  const t = await getTranslations("catalog");
  const result = await getPublicPackAction({ slug });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    throw new Error(result.error);
  }

  return (
    <PackDetailPageContainer
      pack={result.data}
      labels={{
        back: t("packs.backToList"),
        sku: t("packs.sku"),
        includes: t("packs.includes"),
        addToCart: t("actions.addToCart"),
        description: t("packs.description"),
        unavailable: t("packs.unavailable"),
        decreaseQuantity: t("packs.decreaseQuantity"),
        increaseQuantity: t("packs.increaseQuantity"),
      }}
    />
  );
}

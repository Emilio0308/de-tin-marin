import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicBundleAction } from "@/modules/catalog/actions/get-public-bundle";
import { BundleDetailPage } from "@/modules/catalog/components/bundle-detail-page/bundle-detail-page";

type BundleDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function BundleDetailRoute({
  params,
}: BundleDetailRouteProps) {
  const { id } = await params;
  const t = await getTranslations("catalog");
  const result = await getPublicBundleAction({ id });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    throw new Error(result.error);
  }

  return (
    <BundleDetailPage
      bundle={result.data}
      labels={{
        back: t("bundles.backToList"),
        container: t("bundles.container"),
        quantity: t("bundles.quantity"),
        items: t("bundles.items"),
        personalize: t("actions.personalize"),
        description: t("bundles.description"),
      }}
    />
  );
}

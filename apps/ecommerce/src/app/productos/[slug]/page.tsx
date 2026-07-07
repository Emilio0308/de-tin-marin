import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicProductAction } from "@/modules/catalog/actions/get-public-product";
import { ProductDetailPageContainer } from "@/modules/catalog/components/product-detail-page/product-detail-page.container";

type ProductDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailRoute({
  params,
}: ProductDetailRouteProps) {
  const { slug } = await params;
  const t = await getTranslations("catalog");
  const result = await getPublicProductAction({ slug });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    throw new Error(result.error);
  }

  return (
    <ProductDetailPageContainer
      product={result.data}
      labels={{
        back: t("products.backToList"),
        sku: t("products.sku"),
        category: t("products.category"),
        stock: t("products.stock"),
        addToCart: t("actions.addToCart"),
        description: t("products.description"),
      }}
    />
  );
}

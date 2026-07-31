import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicProductAction } from "@/modules/catalog/actions/get-public-product";
import { listPublicProductsAction } from "@/modules/catalog/actions/list-public-products";
import { ProductDetailPageContainer } from "@/modules/catalog/components/product-detail-page/product-detail-page.container";
import { resolveProductTypeLabel } from "@/modules/catalog/components/product-detail-page/product-detail-page.helpers";
import type { ProductDetailSuggestedItem } from "@/modules/catalog/components/product-detail-page/product-detail-page.types";

type ProductDetailRouteProps = {
  params: Promise<{ slug: string }>;
};

async function loadSuggestions(
  productId: string,
  categoryId: string,
): Promise<ProductDetailSuggestedItem[]> {
  const result = await listPublicProductsAction({
    categoryId,
    pageSize: 12,
    page: 1,
  });
  if (!result.ok) return [];

  return result.data.items
    .filter((item) => item.id !== productId)
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      finalPrice: item.finalPrice,
    }));
}

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

  const product = result.data;
  const suggestions = await loadSuggestions(product.id, product.categoryId);

  const productTypeLabel = resolveProductTypeLabel(product, {
    productTypeUnit: t("products.productTypeUnit"),
    packageUnits: (count) => t("products.packageUnits", { count }),
  });

  return (
    <ProductDetailPageContainer
      product={product}
      suggestions={suggestions}
      labels={{
        back: t("products.backToList"),
        dulces: t("products.dulces"),
        sku: t("products.sku"),
        category: t("products.category"),
        quantity: t("products.quantity"),
        availability: t("products.availability"),
        inStock: t("products.inStock", { stock: product.stockDisplay }),
        outOfStock: t("products.outOfStock"),
        addToCart: t("products.addToCart"),
        description: t("products.description"),
        productTypeLabel,
        decreaseQuantity: t("products.decreaseQuantity"),
        increaseQuantity: t("products.increaseQuantity"),
        relatedTitle: t("products.relatedTitle"),
        relatedSubtitle: t("products.relatedSubtitle"),
        viewAll: t("products.viewAll"),
        completeGiftTitle: t("products.completeGiftTitle"),
        whyTitle: t("products.whyTitle"),
        highlightArtisanal: t("products.highlightArtisanal"),
        highlightFresh: t("products.highlightFresh"),
        highlightShipping: t("products.highlightShipping"),
        whyFruit: t("products.whyFruit"),
        whyTexture: t("products.whyTexture"),
        whyGift: t("products.whyGift"),
        whyLove: t("products.whyLove"),
      }}
    />
  );
}

import { notFound } from "next/navigation";
import { getProductAction } from "@/modules/catalog/actions/get-product";
import { ProductFormContainer } from "@/modules/catalog/components/product-form/product-form.container";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const result = await getProductAction(id);

  if (!result.ok || !result.data) {
    notFound();
  }

  return <ProductFormContainer mode="edit" initial={result.data} />;
}

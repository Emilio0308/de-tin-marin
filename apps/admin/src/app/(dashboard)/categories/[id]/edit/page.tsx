import { notFound } from "next/navigation";
import { getCategoryAction } from "@/modules/catalog/actions/get-category";
import { CategoryFormContainer } from "@/modules/catalog/components/category-form/category-form.container";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const result = await getCategoryAction(id);

  if (!result.ok || !result.data) {
    notFound();
  }

  return <CategoryFormContainer mode="edit" initial={result.data} />;
}

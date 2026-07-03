import { notFound } from "next/navigation";
import { getBundleAction } from "@/modules/catalog/actions/get-bundle";
import { BundleFormContainer } from "@/modules/catalog/components/bundle-form/bundle-form.container";

type EditBundlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBundlePage({ params }: EditBundlePageProps) {
  const { id } = await params;
  const result = await getBundleAction(id);

  if (!result.ok || !result.data) {
    notFound();
  }

  return <BundleFormContainer mode="edit" initial={result.data} />;
}

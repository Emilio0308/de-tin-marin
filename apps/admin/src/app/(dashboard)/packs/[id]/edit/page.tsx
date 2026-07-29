import { notFound } from "next/navigation";
import { getPackAction } from "@/modules/catalog/actions/get-pack";
import { PackFormContainer } from "@/modules/catalog/components/pack-form/pack-form.container";

type EditPackPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPackPage({ params }: EditPackPageProps) {
  const { id } = await params;
  const result = await getPackAction(id);

  if (!result.ok || !result.data) {
    notFound();
  }

  return <PackFormContainer mode="edit" initial={result.data} />;
}

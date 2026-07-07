import { notFound } from "next/navigation";
import { getSurpriseContainerAction } from "@/modules/catalog/actions/get-surprise-container";
import { ContainerFormContainer } from "@/modules/catalog/components/container-form/container-form.container";

type EditContainerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContainerPage({
  params,
}: EditContainerPageProps) {
  const { id } = await params;
  const result = await getSurpriseContainerAction(id);

  if (!result.ok || !result.data) {
    notFound();
  }

  return <ContainerFormContainer mode="edit" initial={result.data} />;
}

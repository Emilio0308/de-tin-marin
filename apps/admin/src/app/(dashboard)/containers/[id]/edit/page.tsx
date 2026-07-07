import { ContainerFormContainer } from "@/modules/catalog/components/container-form/container-form.container";

type EditContainerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContainerPage({
  params,
}: EditContainerPageProps) {
  const { id } = await params;
  return <ContainerFormContainer mode="edit" containerId={id} />;
}

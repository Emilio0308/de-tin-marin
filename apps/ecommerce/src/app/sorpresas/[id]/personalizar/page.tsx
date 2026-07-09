import { notFound } from "next/navigation";
import { getBundleForWizardAction } from "@/modules/bundle-wizard/actions/get-bundle-for-wizard";
import { BundleWizardPageContainer } from "@/modules/bundle-wizard/components/bundle-wizard-page/bundle-wizard-page.container";

type PersonalizeRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonalizeRoute({
  params,
}: PersonalizeRouteProps) {
  const { id } = await params;
  const result = await getBundleForWizardAction({ bundleId: id });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    throw new Error(result.error);
  }

  return <BundleWizardPageContainer template={result.data} />;
}

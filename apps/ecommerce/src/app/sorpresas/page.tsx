import { Suspense } from "react";
import { BundlesPageContainer } from "@/modules/catalog/components/bundles-page/bundles-page.container";

export default function SorpresasPage() {
  return (
    <Suspense fallback={null}>
      <BundlesPageContainer />
    </Suspense>
  );
}

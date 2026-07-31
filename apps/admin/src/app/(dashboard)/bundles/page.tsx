import { Suspense } from "react";
import { BundleListContainer } from "@/modules/catalog/components/bundle-list/bundle-list.container";

export default function BundlesPage() {
  return (
    <Suspense fallback={null}>
      <BundleListContainer />
    </Suspense>
  );
}

import { Suspense } from "react";
import { PackListContainer } from "@/modules/catalog/components/pack-list/pack-list.container";

export default function PacksPage() {
  return (
    <Suspense fallback={null}>
      <PackListContainer />
    </Suspense>
  );
}

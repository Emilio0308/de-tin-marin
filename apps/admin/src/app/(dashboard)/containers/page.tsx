import { Suspense } from "react";
import { ContainerListContainer } from "@/modules/catalog/components/container-list/container-list.container";

export default function ContainersPage() {
  return (
    <Suspense fallback={null}>
      <ContainerListContainer />
    </Suspense>
  );
}

import { Suspense } from "react";
import { StorefrontPageContainer } from "@/modules/home/components/storefront-page/storefront-page.container";

export default function HomeRoute() {
  return (
    <Suspense fallback={null}>
      <StorefrontPageContainer />
    </Suspense>
  );
}

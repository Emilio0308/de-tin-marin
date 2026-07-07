import { Suspense } from "react";
import { GuestOrderLookupPageContainer } from "@/modules/orders/components/guest-order-lookup-page/guest-order-lookup-page.container";

export default function GuestOrderLookupRoute() {
  return (
    <Suspense fallback={null}>
      <GuestOrderLookupPageContainer />
    </Suspense>
  );
}

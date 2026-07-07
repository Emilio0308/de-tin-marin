import { Suspense } from "react";
import { OrderConfirmationPageContainer } from "@/modules/orders/components/order-confirmation-page/order-confirmation-page.container";
import { OrderConfirmationPageFallback } from "@/modules/orders/components/order-confirmation-page/order-confirmation-page.fallback";

export default function OrderConfirmationRoute() {
  return (
    <Suspense fallback={<OrderConfirmationPageFallback />}>
      <OrderConfirmationPageContainer />
    </Suspense>
  );
}

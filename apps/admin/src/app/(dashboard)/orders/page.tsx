import { Suspense } from "react";
import { OrderListContainer } from "@/modules/orders/components/order-list/order-list.container";

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrderListContainer />
    </Suspense>
  );
}

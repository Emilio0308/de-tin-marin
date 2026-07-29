import { Suspense } from "react";
import { CartPageContainer } from "@/modules/cart/components/cart-page/cart-page.container";

export default function CartRoute() {
  return (
    <Suspense fallback={null}>
      <CartPageContainer />
    </Suspense>
  );
}

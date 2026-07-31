import { Suspense } from "react";
import { ProductListContainer } from "@/modules/catalog/components/product-list/product-list.container";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductListContainer />
    </Suspense>
  );
}

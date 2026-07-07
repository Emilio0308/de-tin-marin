import { Suspense } from "react";
import { ProductsPageContainer } from "@/modules/catalog/components/products-page/products-page.container";

export default function ProductosPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContainer />
    </Suspense>
  );
}

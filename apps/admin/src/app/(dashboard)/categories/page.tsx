import { Suspense } from "react";
import { CategoryListContainer } from "@/modules/catalog/components/category-list/category-list.container";

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoryListContainer />
    </Suspense>
  );
}

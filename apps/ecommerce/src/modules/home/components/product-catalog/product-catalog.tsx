import { CategoryNav } from "@/modules/home/components/category-nav/category-nav";
import { ProductCard } from "@/modules/home/components/product-card/product-card";
import type { ProductCatalogProps } from "./product-catalog.types";

export function ProductCatalog({
  categories,
  products,
  activeCategoryId,
}: ProductCatalogProps) {
  return (
    <section className="bg-surface py-stack-lg">
      <div className="container-max px-gutter">
        <div className="gap-stack-lg flex flex-col lg:flex-row">
          <CategoryNav categories={categories} activeId={activeCategoryId} />

          <div className="w-full lg:w-3/4">
            <div className="mb-stack-md flex items-end justify-between">
              <div>
                <h2 className="font-display text-headline-md text-on-surface">
                  Catálogo Completo
                </h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  Explora todos nuestros dulces y sorpresas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

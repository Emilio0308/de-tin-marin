import Image from "next/image";
import Link from "next/link";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";

export type ProductDetailPageProps = {
  product: PublicProductDetail;
  labels: {
    back: string;
    sku: string;
    category: string;
    stock: string;
    addToCart: string;
    description: string;
  };
};

export function ProductDetailPage({ product, labels }: ProductDetailPageProps) {
  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <Link
          href="/productos"
          className="font-label text-label-bold text-primary hover:text-secondary mb-8 inline-block"
        >
          {labels.back}
        </Link>

        <div className="gap-stack-lg grid grid-cols-1 items-start lg:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px]">
            <Image
              src={product.imageUrl ?? ""}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 32rem"
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md">
              {product.name}
            </h1>
            <p className="font-display text-price-display text-primary">
              {formatPrice(product.finalPrice)}
            </p>
            <dl className="font-body text-body-md text-on-surface-variant space-y-2">
              <div>
                <dt className="font-label text-label-bold text-on-surface inline">
                  {labels.sku}:{" "}
                </dt>
                <dd className="inline">{product.sku}</dd>
              </div>
              <div>
                <dt className="font-label text-label-bold text-on-surface inline">
                  {labels.category}:{" "}
                </dt>
                <dd className="inline">{product.categoryName}</dd>
              </div>
              <div>
                <dt className="font-label text-label-bold text-on-surface inline">
                  {labels.stock}:{" "}
                </dt>
                <dd className="inline">{product.stockDisplay}</dd>
              </div>
            </dl>
            {product.description ? (
              <div>
                <h2 className="font-label text-label-bold text-on-surface mb-2">
                  {labels.description}
                </h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  {product.description}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              className="press-down bg-primary font-label text-label-bold text-on-primary rounded-full px-8 py-3"
            >
              {labels.addToCart}
            </button>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

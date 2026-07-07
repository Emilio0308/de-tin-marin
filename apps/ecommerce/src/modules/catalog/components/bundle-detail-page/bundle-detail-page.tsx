import Image from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { PublicBundleDetail } from "@de-tin-marin/validations/public-catalog";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";

export type BundleDetailPageProps = {
  bundle: PublicBundleDetail;
  labels: {
    back: string;
    container: string;
    quantity: string;
    items: string;
    personalize: string;
    description: string;
  };
};

export function BundleDetailPage({ bundle, labels }: BundleDetailPageProps) {
  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <Link
          href="/sorpresas"
          className="font-label text-label-bold text-primary hover:text-secondary mb-8 inline-block"
        >
          {labels.back}
        </Link>

        <div className="gap-stack-lg grid grid-cols-1 items-start lg:grid-cols-2">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[32px]">
            <Image
              src={bundle.imageUrl ?? ""}
              alt={bundle.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 24rem"
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md">
              {bundle.name}
            </h1>
            <p className="font-display text-price-display text-primary">
              {formatPrice(bundle.total)}
            </p>
            <dl className="font-body text-body-md text-on-surface-variant space-y-2">
              <div>
                <dt className="font-label text-label-bold text-on-surface inline">
                  {labels.container}:{" "}
                </dt>
                <dd className="inline">{bundle.containerName}</dd>
              </div>
              <div>
                <dt className="font-label text-label-bold text-on-surface inline">
                  {labels.quantity}:{" "}
                </dt>
                <dd className="inline">{bundle.quantity}</dd>
              </div>
            </dl>
            {bundle.description ? (
              <div>
                <h2 className="font-label text-label-bold text-on-surface mb-2">
                  {labels.description}
                </h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  {bundle.description}
                </p>
              </div>
            ) : null}
            <div>
              <h2 className="font-label text-label-bold text-on-surface mb-3">
                {labels.items}
              </h2>
              <ul className="font-body text-body-md text-on-surface-variant space-y-2">
                {bundle.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-2">
                    <CircleCheck className="text-primary h-[18px] w-[18px]" />
                    {item.productName} × {item.unitsPerPerson}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={`/sorpresas/${bundle.id}/personalizar`}
              className="press-down bg-primary font-label text-label-bold text-on-primary inline-block rounded-full px-8 py-3"
            >
              {labels.personalize}
            </Link>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

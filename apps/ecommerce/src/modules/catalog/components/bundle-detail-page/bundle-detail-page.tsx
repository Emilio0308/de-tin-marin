import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";
import type { BundleDetailPageProps } from "./bundle-detail-page.types";

function BundleDetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="gap-stack-sm border-outline-variant/30 flex items-baseline justify-between border-b py-3 last:border-b-0">
      <dt className="font-label text-label-bold text-on-surface">{label}</dt>
      <dd className="font-body text-body-md text-on-surface-variant text-right">
        {value}
      </dd>
    </div>
  );
}

function PersonalizeButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container inline-flex min-h-12 items-center justify-center rounded-full px-8 py-3 transition-all duration-300 hover:scale-[1.02] ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}

export function BundleDetailPage({
  bundle,
  labels,
  personalizeHref,
}: BundleDetailPageProps) {
  return (
    <StorefrontLayout>
      <section className="bg-tertiary/5 pt-stack-md md:pb-section-lg md:pt-stack-lg pb-28">
        <div className="container-max px-gutter">
          <Link
            href={storefrontTabHref("sorpresas")}
            className="font-label text-label-bold text-primary hover:text-secondary inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {labels.back}
          </Link>

          <div className="gap-stack-lg mt-stack-md grid grid-cols-1 items-start lg:grid-cols-2">
            <div className="surprise-card-border soft-glow-pink bg-surface-container-lowest rounded-[32px] p-4 md:p-6">
              <div className="bg-surface-container-low relative aspect-square w-full overflow-hidden rounded-[24px]">
                <Image
                  src={bundle.imageUrl ?? ""}
                  alt={bundle.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 32rem"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-stack-md">
              <div className="gap-stack-sm flex flex-wrap">
                <span className="border-outline-variant text-primary font-label text-label-bold rounded-full border px-4 py-1.5">
                  {bundle.containerName}
                </span>
                <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold rounded-full px-4 py-1.5">
                  {labels.personCount}
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
                  {bundle.name}
                </h1>
                <p className="font-display text-price-display text-primary">
                  {formatPrice(bundle.total)}
                </p>
              </div>

              <dl className="bg-surface-container-low border-outline-variant/30 rounded-2xl border px-4">
                <BundleDetailMeta
                  label={labels.container}
                  value={bundle.containerName}
                />
                <BundleDetailMeta
                  label={labels.quantity}
                  value={labels.personCount}
                />
              </dl>

              {bundle.description ? (
                <div className="space-y-2">
                  <h2 className="font-label text-label-bold text-on-surface">
                    {labels.description}
                  </h2>
                  <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
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
                    <li
                      key={item.productId}
                      className="flex items-center gap-2"
                    >
                      <CircleCheck
                        className="text-primary h-[18px] w-[18px] shrink-0"
                        aria-hidden
                      />
                      {item.productName} × {item.unitsPerPerson}
                    </li>
                  ))}
                </ul>
              </div>

              <PersonalizeButton
                href={personalizeHref}
                label={labels.personalize}
                className="hidden md:inline-flex"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="border-outline-variant/20 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-md md:hidden">
        <PersonalizeButton
          href={personalizeHref}
          label={labels.personalize}
          className="w-full"
        />
      </div>
    </StorefrontLayout>
  );
}

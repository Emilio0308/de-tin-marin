import Image from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import type { BundleCardProps } from "./bundle-card.types";

export function BundleCard({
  bundle,
  detailHref,
  personalizeLabel = "Lo quiero",
}: BundleCardProps) {
  const title = detailHref ? (
    <Link href={detailHref} className="hover:text-primary">
      {bundle.name}
    </Link>
  ) : (
    bundle.name
  );

  const personalizeHref = detailHref ? `${detailHref}/personalizar` : undefined;

  return (
    <article className="surprise-card-border bg-surface-container-lowest flex flex-col items-center gap-6 rounded-[32px] p-8 transition-all duration-500 hover:shadow-2xl md:flex-row">
      <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl">
        {detailHref ? (
          <Link href={detailHref} className="relative block h-full w-full">
            <Image
              src={bundle.imageUrl}
              alt={bundle.imageAlt}
              fill
              sizes="12rem"
              className="object-cover"
            />
          </Link>
        ) : (
          <Image
            src={bundle.imageUrl}
            alt={bundle.imageAlt}
            fill
            sizes="12rem"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-grow">
        <h3 className="font-display text-headline-md text-on-surface mb-2">
          {title}
        </h3>
        <ul className="font-body text-body-md text-on-surface-variant mb-6 space-y-1">
          {bundle.features.map((feature) => (
            <li key={feature.id} className="flex items-center gap-2">
              <CircleCheck className="text-primary h-[18px] w-[18px]" />
              {feature.label}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <span className="font-display text-price-display text-primary">
            {formatPrice(bundle.price)}
          </span>
          {personalizeHref ? (
            <Link
              href={personalizeHref}
              className="press-down bg-primary font-label text-label-bold text-on-primary rounded-full px-6 py-2"
            >
              {personalizeLabel}
            </Link>
          ) : (
            <button
              type="button"
              className="press-down bg-primary font-label text-label-bold text-on-primary rounded-full px-6 py-2"
            >
              {personalizeLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

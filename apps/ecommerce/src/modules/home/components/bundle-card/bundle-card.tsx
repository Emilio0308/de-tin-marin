import Image from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import type { BundleCardProps } from "./bundle-card.types";

function BundleCardImage({
  bundle,
  detailHref,
  variant,
}: Pick<BundleCardProps, "bundle" | "detailHref" | "variant">) {
  const image =
    variant === "featured" ? (
      <Image
        src={bundle.imageUrl}
        alt={bundle.imageAlt}
        fill
        sizes="12rem"
        className="object-cover"
      />
    ) : (
      <Image
        src={bundle.imageUrl}
        alt={bundle.imageAlt}
        width={400}
        height={400}
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 12rem, 33vw"
        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 md:absolute md:inset-0 md:h-full md:max-h-none md:w-full md:max-w-none md:object-cover md:group-hover:scale-110"
      />
    );

  const imageWrapperClass = cn(
    "relative overflow-hidden",
    variant === "listing" &&
      "mb-6 mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center rounded-2xl bg-surface-variant/20 p-4 md:mx-0 md:mb-0 md:block md:max-w-none md:aspect-square md:w-1/3 md:shrink-0 md:bg-surface-container-lowest md:p-0",
    variant === "featured" && "h-48 w-48 shrink-0 rounded-2xl",
  );

  if (detailHref) {
    return (
      <Link href={detailHref} className={imageWrapperClass}>
        {image}
      </Link>
    );
  }

  return <div className={imageWrapperClass}>{image}</div>;
}

function BundleCardCta({
  personalizeHref,
  personalizeLabel,
  variant,
  className,
}: {
  personalizeHref?: string;
  personalizeLabel: string;
  variant: BundleCardProps["variant"];
  className?: string;
}) {
  const ctaClassName = cn(
    "press-down bg-primary font-label text-label-bold text-on-primary inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap transition-all",
    variant === "listing" &&
      "px-6 py-3 shadow-md active:scale-95 md:px-4 md:py-2 md:shadow-none lg:px-8 lg:py-3 lg:hover:bg-primary-container lg:hover:shadow-lg",
    variant === "featured" && "px-6 py-2",
    className,
  );

  if (personalizeHref) {
    return (
      <Link href={personalizeHref} className={ctaClassName}>
        {personalizeLabel}
      </Link>
    );
  }

  return (
    <button type="button" className={ctaClassName}>
      {personalizeLabel}
    </button>
  );
}

export function BundleCard({
  bundle,
  detailHref,
  personalizeLabel = "Lo quiero",
  priceLabel = "Precio",
  variant = "listing",
}: BundleCardProps) {
  const personalizeHref = detailHref ? `${detailHref}/personalizar` : undefined;
  const formattedPrice = formatPrice(bundle.price);

  const title = detailHref ? (
    <Link href={detailHref} className="hover:text-primary">
      {bundle.name}
    </Link>
  ) : (
    bundle.name
  );

  return (
    <article
      className={cn(
        "group flex w-full transition-all duration-300",
        variant === "listing" &&
          "border-primary flex-col rounded-[32px] border bg-white p-4 shadow-sm hover:shadow-xl md:flex-row md:gap-6 md:p-6",
        variant === "featured" &&
          "surprise-card-border bg-surface-container-lowest flex-col items-center gap-6 rounded-[32px] p-8 hover:shadow-2xl md:flex-row md:items-start",
      )}
    >
      <BundleCardImage
        bundle={bundle}
        detailHref={detailHref}
        variant={variant}
      />

      <div
        className={cn(
          "@container/content flex min-w-0 flex-1 flex-col",
          variant === "listing" && "px-2 md:px-0",
        )}
      >
        <h3
          className={cn(
            "font-display text-headline-md text-on-surface wrap-break-word",
            variant === "listing" && "mb-3 md:mb-4",
            variant === "featured" && "mb-2",
          )}
        >
          {title}
        </h3>

        <ul
          className={cn(
            "font-body text-body-md text-on-surface-variant",
            variant === "listing" && "mb-6 space-y-1 md:space-y-3",
            variant === "featured" && "mb-6 space-y-1",
          )}
        >
          {bundle.features.map((feature) => (
            <li
              key={feature.id}
              className="flex min-w-0 items-start gap-2 md:gap-3"
            >
              <CircleCheck
                className={cn(
                  "text-primary mt-0.5 shrink-0",
                  variant === "listing" && "h-[18px] w-[18px] md:h-5 md:w-5",
                  variant === "featured" && "h-[18px] w-[18px]",
                )}
              />
              <span className="wrap-break-word min-w-0">{feature.label}</span>
            </li>
          ))}
        </ul>

        <div className="@[17rem]/content:flex-row @[17rem]/content:items-center @[17rem]/content:justify-between mt-auto flex flex-col gap-3">
          {variant === "listing" ? (
            <div className="flex min-w-0 shrink-0 flex-col">
              <span className="font-label text-label-bold text-outline text-[10px] uppercase md:hidden">
                {priceLabel}
              </span>
              <span className="font-display text-price-display text-primary lg:text-[28px]">
                {formattedPrice}
              </span>
            </div>
          ) : (
            <span className="font-display text-price-display text-primary shrink-0">
              {formattedPrice}
            </span>
          )}

          <BundleCardCta
            personalizeHref={personalizeHref}
            personalizeLabel={personalizeLabel}
            variant={variant}
            className={
              variant === "listing"
                ? "@[17rem]/content:w-auto w-full"
                : undefined
            }
          />
        </div>
      </div>
    </article>
  );
}

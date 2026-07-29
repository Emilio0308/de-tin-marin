import Link from "next/link";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";

type ComingSoonPageProps = {
  title: string;
  description: string;
  backLabel: string;
};

export function ComingSoonPage({
  title,
  description,
  backLabel,
}: ComingSoonPageProps) {
  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-4">
          {title}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mb-8 max-w-lg">
          {description}
        </p>
        <Link
          href="/"
          className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary rounded-full px-8 py-3 transition-all duration-300 hover:scale-105"
        >
          {backLabel}
        </Link>
      </section>
    </StorefrontLayout>
  );
}

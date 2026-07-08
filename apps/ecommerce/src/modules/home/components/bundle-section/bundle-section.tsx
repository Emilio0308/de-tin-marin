import { BundleCard } from "@/modules/home/components/bundle-card/bundle-card";
import type { BundleSectionProps } from "./bundle-section.types";

export function BundleSection({ bundles }: BundleSectionProps) {
  return (
    <section className="bg-tertiary/5 py-20">
      <div className="container-max px-gutter">
        <div className="mb-stack-lg text-center">
          <h2 className="font-display text-display-lg-mobile text-on-tertiary-fixed-variant md:text-[36px]">
            Combos Cumpleañeros
          </h2>
          <p className="font-body text-body-lg text-tertiary mx-auto max-w-xl">
            La mezcla perfecta de dulces y sorpresas para celebrar a lo grande.
          </p>
        </div>
        <div className="gap-stack-lg grid grid-cols-1 lg:grid-cols-2">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  );
}

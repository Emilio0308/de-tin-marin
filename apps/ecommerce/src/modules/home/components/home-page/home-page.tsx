import { HeroSectionContainer } from "@/modules/home/components/hero-section/hero-section.container";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";

export function HomePage() {
  return (
    <StorefrontLayout>
      <HeroSectionContainer />
    </StorefrontLayout>
  );
}

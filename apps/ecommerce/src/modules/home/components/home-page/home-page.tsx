import { BundleSection } from "@/modules/home/components/bundle-section/bundle-section";
import { HelpFab } from "@/modules/home/components/help-fab/help-fab";
import { HeroSection } from "@/modules/home/components/hero-section/hero-section";
import { ProductCatalog } from "@/modules/home/components/product-catalog/product-catalog";
import { SiteFooter } from "@/modules/home/components/site-footer/site-footer";
import { SiteHeaderContainer } from "@/modules/home/components/site-header/site-header.container";
import {
  HOME_BUNDLES,
  HOME_CATEGORIES,
  HOME_PRODUCTS,
} from "@/modules/home/data/home.data";

export function HomePage() {
  return (
    <div id="top" className="bg-background text-on-surface">
      <SiteHeaderContainer />
      <main className="pt-20">
        <HeroSection />
        <ProductCatalog
          categories={HOME_CATEGORIES}
          products={HOME_PRODUCTS}
          activeCategoryId="caramelos"
        />
        <BundleSection bundles={HOME_BUNDLES} />
      </main>
      <SiteFooter />
      <HelpFab />
    </div>
  );
}

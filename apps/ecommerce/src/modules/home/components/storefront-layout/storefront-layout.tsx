import { HelpFab } from "@/modules/home/components/help-fab/help-fab";
import { SiteFooter } from "@/modules/home/components/site-footer/site-footer";
import { SiteHeaderContainer } from "@/modules/home/components/site-header/site-header.container";

type StorefrontLayoutProps = {
  children: React.ReactNode;
};

export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div id="top" className="bg-background text-on-surface">
      <SiteHeaderContainer />
      <main className="pt-20">{children}</main>
      <SiteFooter />
      <HelpFab />
    </div>
  );
}

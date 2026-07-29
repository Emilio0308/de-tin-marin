"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { HOME_NAV_ROUTES } from "@/modules/home/data/home.data";
import { readStorefrontTab } from "@/modules/home/helpers/storefront-url";
import type { HomeNavLink } from "@/modules/home/types/home.types";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { SiteHeader } from "./site-header";

function resolveActiveIndex(pathname: string, tab: string): number {
  if (pathname.startsWith("/productos")) return 0;
  if (pathname.startsWith("/sorpresas")) return 1;
  if (pathname === "/") return tab === "sorpresas" ? 1 : 0;

  return HOME_NAV_ROUTES.findIndex(
    (route) => !route.href.startsWith("/?") && pathname === route.href,
  );
}

function SiteHeaderContainerInner() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("nav");
  const { itemCount } = useCart();

  const navLinks = useMemo<HomeNavLink[]>(
    () =>
      HOME_NAV_ROUTES.map((route) => ({
        href: route.href,
        label: t(route.labelKey),
      })),
    [t],
  );

  const activeIndex = resolveActiveIndex(
    pathname,
    readStorefrontTab(searchParams),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <SiteHeader
      navLinks={navLinks}
      activeIndex={activeIndex}
      scrolled={scrolled}
      cartCount={itemCount}
    />
  );
}

export function SiteHeaderContainer() {
  return (
    <Suspense fallback={null}>
      <SiteHeaderContainerInner />
    </Suspense>
  );
}

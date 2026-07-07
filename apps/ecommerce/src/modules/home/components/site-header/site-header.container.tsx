"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HOME_NAV_ROUTES } from "@/modules/home/data/home.data";
import type { HomeNavLink } from "@/modules/home/types/home.types";
import { SiteHeader } from "./site-header";

function resolveActiveIndex(pathname: string): number {
  return HOME_NAV_ROUTES.findIndex(
    (route) => route.href.startsWith("/") && pathname === route.href,
  );
}

export function SiteHeaderContainer() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navLinks = useMemo<HomeNavLink[]>(
    () =>
      HOME_NAV_ROUTES.map((route) => ({
        href: route.href,
        label: t(route.labelKey),
      })),
    [t],
  );

  const activeIndex = resolveActiveIndex(pathname);

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
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { HOME_NAV_LINKS } from "@/modules/home/data/home.data";
import { SiteHeader } from "./site-header";

export function SiteHeaderContainer() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <SiteHeader navLinks={HOME_NAV_LINKS} activeIndex={0} scrolled={scrolled} />
  );
}

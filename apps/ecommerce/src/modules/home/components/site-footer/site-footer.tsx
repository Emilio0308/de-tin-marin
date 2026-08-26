"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { HOME_NAV_ROUTES } from "@/modules/home/data/home.data";

const EXPLORE_HREFS = new Set([
  "/?tab=productos",
  "/?tab=sorpresas",
  "/?tab=combos",
]);

export function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const exploreLinks = HOME_NAV_ROUTES.filter((route) =>
    EXPLORE_HREFS.has(route.href),
  ).map((route) => ({
    href: route.href,
    label: tNav(route.labelKey),
  }));

  const helpLinks = [
    {
      href: "/mis-pedidos",
      label: tNav("myOrders"),
    },
    {
      href: "/nosotros",
      label: t("contact"),
    },
  ] as const;

  const legalLinks = [
    { label: t("privacy"), href: "/politica-de-privacidad" },
    { label: t("terms"), href: "/terminos-y-condiciones" },
  ] as const;

  return (
    <footer className="bg-surface-container-high">
      <div className="container-max px-gutter py-stack-lg">
        <div className="mb-stack-md gap-stack-md border-outline-variant/30 pb-stack-md flex flex-col items-start justify-between border-b md:flex-row">
          <div className="space-y-4">
            <Link
              href="/"
              aria-label={t("homeAria")}
              className="font-display text-headline-md text-primary hover:text-primary-container inline-block cursor-pointer transition-colors"
            >
              De Tin Marín
            </Link>
            <p className="font-body text-body-md text-tertiary max-w-xs">
              {t("tagline")}
            </p>
          </div>

          <div className="gap-stack-md grid grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-label text-label-bold text-on-surface">
                {t("explore")}
              </h3>
              <div className="flex flex-col gap-2">
                {exploreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-label text-label-bold text-on-surface-variant hover:text-secondary cursor-pointer transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-label text-label-bold text-on-surface">
                {t("help")}
              </h3>
              <div className="flex flex-col gap-2">
                {helpLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-label text-label-bold text-on-surface-variant hover:text-secondary cursor-pointer transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-label text-label-bold text-on-surface">
              {t("subscribe")}
            </h3>
            <form className="flex">
              <input
                type="email"
                placeholder={t("subscribeEmailPlaceholder")}
                aria-label={t("subscribeEmailAria")}
                className="bg-surface-container-lowest focus:ring-primary w-48 rounded-l-full border-none px-4 py-2 focus:outline-none focus:ring-2"
              />
              <button
                type="submit"
                aria-label={t("subscribeSubmitAria")}
                className="press-down bg-primary text-on-primary cursor-pointer rounded-r-full px-4 py-2"
              >
                <Send className="h-5 w-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-body text-body-md text-on-surface-variant text-center md:text-left">
            {t("copyright")}
          </p>
          <div className="gap-stack-md flex">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-label text-label-bold text-on-surface-variant hover:text-secondary cursor-pointer transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

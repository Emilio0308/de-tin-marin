"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

import { cn } from "@de-tin-marin/shared/cn";

import type { HomeNavLink } from "@/modules/home/types/home.types";
import { getSiteNavLinkIcon, isCatalogNavLink } from "./site-header.helpers";
import type { SiteHeaderProps } from "./site-header.types";

function isInternalRoute(href: string): boolean {
  return href.startsWith("/");
}

function isStorefrontTabLink(href: string): boolean {
  return href.includes("tab=");
}

const WITCH_SEARCH_ENABLED = false;

type NavLinkRendererProps = {
  link: HomeNavLink;
  active: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

function NavLinkItem({
  link,
  active,
  mobile = false,
  onNavigate,
}: NavLinkRendererProps) {
  const Icon = getSiteNavLinkIcon(link.href);

  const className = cn(
    "font-label focus-visible:ring-primary rounded-xl transition-[color,transform,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2",
    mobile
      ? "group flex min-h-12 items-center gap-3 px-3 py-2.5"
      : "text-label-bold rounded-full px-2 py-1.5 hover:bg-primary-fixed/40 hover:text-secondary",
    active
      ? mobile
        ? "bg-primary text-on-primary shadow-primary/15 shadow-sm"
        : "bg-primary-fixed/50 text-primary font-bold"
      : mobile
        ? "text-on-surface hover:bg-surface-container-high"
        : "text-on-surface-variant",
  );

  const content = mobile ? (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-on-primary/15 text-on-primary"
            : "bg-primary-fixed/60 text-primary group-hover:bg-primary-fixed",
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="text-label-bold flex-1 truncate">{link.label}</span>
      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 transition-transform",
          active
            ? "text-on-primary/80"
            : "text-on-surface-variant/50 group-hover:translate-x-0.5",
        )}
        aria-hidden
      />
    </>
  ) : (
    link.label
  );

  if (isInternalRoute(link.href)) {
    return (
      <Link
        href={link.href}
        scroll={!isStorefrontTabLink(link.href)}
        className={className}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  }

  return (
    <a href={link.href} className={className} onClick={onNavigate}>
      {content}
    </a>
  );
}

function MobileNavSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <p className="font-label text-on-surface-variant/70 mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em]">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

export function SiteHeader({
  navLinks,
  activeIndex,
  scrolled,
  cartCount,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("nav");

  const { catalogLinks, accountLinks } = useMemo(() => {
    const catalog: HomeNavLink[] = [];
    const account: HomeNavLink[] = [];

    for (const link of navLinks) {
      if (isCatalogNavLink(link.href)) {
        catalog.push(link);
      } else {
        account.push(link);
      }
    }

    return { catalogLinks: catalog, accountLinks: account };
  }, [navLinks]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function renderDesktopLinks() {
    return navLinks.map((link, index) => (
      <NavLinkItem
        key={link.href}
        link={link}
        active={index === activeIndex && activeIndex >= 0}
      />
    ));
  }

  function renderMobileLinks(links: HomeNavLink[]) {
    return links.map((link) => {
      const index = navLinks.findIndex((item) => item.href === link.href);

      return (
        <NavLinkItem
          key={link.href}
          link={link}
          active={index === activeIndex && activeIndex >= 0}
          mobile
          onNavigate={closeMobileMenu}
        />
      );
    });
  }

  return (
    <>
      <header
        className={cn(
          "bg-background/90 border-outline-variant/15 fixed top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300",
          scrolled ? "py-1 shadow-sm" : "py-base",
        )}
      >
        <div className="container-max flex h-20 items-center px-4">
          <Link
            href="/"
            className="focus-visible:ring-primary relative flex h-16 shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2"
          >
            <Image
              src="/brand/detinmarin-logo.png"
              alt="De Tin Marín"
              width={180}
              height={64}
              priority
              className="h-14 w-auto object-contain md:h-16"
            />
          </Link>

          <nav
            aria-label={t("menuTitle")}
            className="mx-10 hidden flex-1 items-center justify-center gap-2 lg:flex"
          >
            {renderDesktopLinks()}
          </nav>

          {WITCH_SEARCH_ENABLED && (
            <div className="hidden items-center lg:flex">
              <div className="border-outline-variant/20 bg-surface-container focus-within:border-secondary flex items-center rounded-full border-2 px-4 py-2 transition-colors">
                <Search className="text-on-surface-variant mr-2 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar sorpresas..."
                  aria-label="Buscar sorpresas"
                  className="text-body-md placeholder:text-on-surface-variant/50 w-48 bg-transparent outline-none"
                />
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/carrito"
              aria-label={t("cart")}
              className="text-primary hover:bg-primary-fixed/50 focus-visible:ring-primary relative flex h-11 w-11 items-center justify-center rounded-full transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 ? (
                <span className="bg-secondary text-on-secondary absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/mis-pedidos"
              aria-label={t("myOrders")}
              className="text-primary hover:bg-primary-fixed/50 focus-visible:ring-primary hidden h-11 w-11 items-center justify-center rounded-full transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 lg:flex"
            >
              <User className="h-6 w-6" />
            </Link>

            <button
              type="button"
              aria-label={t("openMenu")}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="text-primary hover:bg-primary-fixed/50 focus-visible:ring-primary flex h-11 w-11 items-center justify-center rounded-full transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 lg:hidden"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="bg-inverse-surface/40 fixed inset-0 z-40 backdrop-blur-[2px] lg:hidden"
            onClick={closeMobileMenu}
          />

          <aside
            aria-label={t("menuTitle")}
            className="bg-surface-container-lowest border-outline-variant/20 fixed right-0 top-0 z-50 flex h-dvh w-[min(100%,20rem)] max-w-[85vw] flex-col overflow-hidden border-l shadow-2xl lg:hidden"
          >
            <div className="from-primary-fixed/70 via-primary-fixed/25 bg-linear-to-br shrink-0 border-b to-transparent px-4 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="focus-visible:ring-primary min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2"
                >
                  <Image
                    src="/brand/detinmarin-logo.png"
                    alt="De Tin Marín"
                    width={160}
                    height={56}
                    className="h-12 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  aria-label={t("closeMenu")}
                  onClick={closeMobileMenu}
                  className="bg-surface-container-lowest/80 text-primary hover:bg-surface-container-lowest focus-visible:ring-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm focus-visible:outline-none focus-visible:ring-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="font-label text-label-bold text-on-surface-variant mt-3 px-1">
                {t("menuTitle")}
              </p>
            </div>

            {WITCH_SEARCH_ENABLED ? (
              <div className="border-outline-variant/15 shrink-0 border-b px-4 py-3">
                <div className="border-outline-variant/20 bg-surface-container flex items-center rounded-full border px-4 py-2.5">
                  <Search className="text-on-surface-variant mr-2 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
              <nav className="space-y-6">
                {catalogLinks.length > 0 ? (
                  <MobileNavSection title={t("sections.explore")}>
                    {renderMobileLinks(catalogLinks)}
                  </MobileNavSection>
                ) : null}

                {accountLinks.length > 0 ? (
                  <MobileNavSection title={t("sections.account")}>
                    {renderMobileLinks(accountLinks)}
                  </MobileNavSection>
                ) : null}
              </nav>
            </div>

            <div className="border-outline-variant/20 shrink-0 border-t p-4">
              <Link
                href="/carrito"
                onClick={closeMobileMenu}
                className="bg-primary text-on-primary font-label text-label-bold focus-visible:ring-primary hover:bg-primary-container flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 shadow-lg transition-[transform,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99]"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden />
                {cartCount > 0
                  ? t("cartWithCount", { count: cartCount })
                  : t("cart")}
              </Link>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}

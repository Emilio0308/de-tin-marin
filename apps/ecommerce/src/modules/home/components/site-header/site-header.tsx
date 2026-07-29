"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";

import { cn } from "@de-tin-marin/shared/cn";

import type { SiteHeaderProps } from "./site-header.types";

function isInternalRoute(href: string): boolean {
  return href.startsWith("/");
}

function isStorefrontTabLink(href: string): boolean {
  return href.includes("tab=");
}

const WITCH_SEARCH_ENABLED = false;

export function SiteHeader({
  navLinks,
  activeIndex,
  scrolled,
  cartCount,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderLinks = (mobile = false) =>
    navLinks.map((link, index) => {
      const className = cn(
        "font-label transition-colors duration-300",
        mobile
          ? "block py-3 text-lg"
          : "text-label-bold hover:text-secondary hover:scale-105",
        index === activeIndex && activeIndex >= 0
          ? "text-primary font-bold"
          : "text-on-surface-variant",
      );

      const onClick = () => setMobileMenuOpen(false);

      if (isInternalRoute(link.href)) {
        return (
          <Link
            key={link.href}
            href={link.href}
            scroll={!isStorefrontTabLink(link.href)}
            className={className}
            onClick={onClick}
          >
            {link.label}
          </Link>
        );
      }

      return (
        <a
          key={link.href}
          href={link.href}
          className={className}
          onClick={onClick}
        >
          {link.label}
        </a>
      );
    });

  return (
    <>
      <header
        className={cn(
          "bg-background/90 fixed top-0 z-50 w-full shadow-sm backdrop-blur-md transition-all duration-300",
          scrolled ? "py-1" : "py-base",
        )}
      >
        <div className="container-max flex h-20 items-center px-4">
          {/* Logo */}
          <Link href="/" className="relative flex h-14 shrink-0 items-center">
            <Image
              src="/brand/detinmarin-logo.png"
              alt="De Tin Marín"
              width={160}
              height={56}
              priority
              className="h-12 w-auto object-contain md:h-14"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="mx-10 hidden flex-1 items-center justify-center gap-8 lg:flex">
            {renderLinks()}
          </nav>

          {/* Desktop Search */}
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

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/carrito"
              aria-label="Carrito"
              className="text-primary relative p-2 transition hover:scale-105"
            >
              <ShoppingCart className="h-6 w-6" />

              {cartCount > 0 && (
                <span className="bg-secondary text-on-secondary absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop User */}
            <Link
              href="/mis-pedidos"
              aria-label="Mis pedidos"
              className="text-primary hidden p-2 transition hover:scale-105 lg:block"
            >
              <User className="h-6 w-6" />
            </Link>

            {/* Mobile Menu */}
            <button
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen(true)}
              className="text-primary p-2 transition hover:scale-105 lg:hidden"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="bg-background fixed right-0 top-0 z-50 flex h-full w-72 flex-col shadow-xl lg:hidden">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-lg font-bold">Menú</span>

              <button
                aria-label="Cerrar menú"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {WITCH_SEARCH_ENABLED && (
              <div className="border-b p-4">
                <div className="border-outline-variant/20 bg-surface-container flex items-center rounded-full border px-4 py-2">
                  <Search className="text-on-surface-variant mr-2 h-5 w-5" />

                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
            )}

            <nav className="flex flex-1 flex-col px-6 py-4">
              {renderLinks(true)}

              <hr className="my-4" />

              <Link
                href="/mis-pedidos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg"
              >
                <User className="h-5 w-5" />
                Mis pedidos
              </Link>

              <Link
                href="/carrito"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                Carrito
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

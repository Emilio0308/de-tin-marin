import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { SiteHeaderProps } from "./site-header.types";

function isInternalRoute(href: string): boolean {
  return href.startsWith("/");
}

export function SiteHeader({
  navLinks,
  activeIndex,
  scrolled,
  cartCount,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background/90 shadow-primary/5 fixed top-0 z-50 w-full shadow-sm backdrop-blur-md transition-all duration-300",
        scrolled ? "py-1" : "py-base",
      )}
    >
      <div className="container-max px-gutter flex h-20 items-center justify-between">
        <Link
          href="/"
          className="font-display text-primary md:text-display-lg text-[32px]"
        >
          De Tin Marín
        </Link>

        <nav className="gap-stack-md hidden items-center md:flex">
          {navLinks.map((link, index) => {
            const className = cn(
              "font-label text-label-bold hover:text-secondary transition-all duration-300 hover:scale-105",
              index === activeIndex && activeIndex >= 0
                ? "border-primary text-primary border-b-2 pb-1 font-bold"
                : "text-on-surface-variant",
            );

            if (isInternalRoute(link.href)) {
              return (
                <Link key={link.href} href={link.href} className={className}>
                  {link.label}
                </Link>
              );
            }

            return (
              <a key={link.href} href={link.href} className={className}>
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="gap-stack-sm flex items-center">
          <div className="border-outline-variant/20 bg-surface-container focus-within:border-secondary hidden items-center rounded-full border-2 px-4 py-2 transition-colors lg:flex">
            <Search className="text-on-surface-variant mr-2 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar sorpresas..."
              aria-label="Buscar sorpresas"
              className="font-body text-body-md placeholder:text-on-surface-variant/50 w-48 border-none bg-transparent focus:outline-none focus:ring-0"
            />
          </div>
          <Link
            href="/carrito"
            aria-label="Ver carrito"
            className="text-primary hover:text-secondary relative p-2 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 ? (
              <span className="bg-secondary text-on-secondary absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label="Mi cuenta"
            className="text-primary hover:text-secondary p-2 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <User className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

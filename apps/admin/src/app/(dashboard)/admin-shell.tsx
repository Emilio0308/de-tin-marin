"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@de-tin-marin/shared/cn";
import { AdminNav } from "./admin-nav";

type AdminShellProps = {
  brand: string;
  subtitle: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  pageTitles: Record<string, string>;
  children: React.ReactNode;
};

function resolveMobileTitle(
  pathname: string,
  pageTitles: Record<string, string>,
): string {
  if (pathname === "/") return pageTitles.dashboard ?? "Dashboard";
  if (pathname.startsWith("/categories")) return pageTitles.categories ?? "";
  if (pathname.startsWith("/products")) return pageTitles.products ?? "";
  if (pathname.startsWith("/bundles")) return pageTitles.bundles ?? "";
  if (pathname.startsWith("/orders")) return pageTitles.orders ?? "";
  return pageTitles.dashboard ?? "Admin";
}

export function AdminShell({
  brand,
  subtitle,
  openMenuLabel,
  closeMenuLabel,
  pageTitles,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileTitle = resolveMobileTitle(pathname, pageTitles);

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      <header className="bg-surface-container-lowest border-outline-variant/30 sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-3 lg:hidden">
        <button
          type="button"
          aria-label={menuOpen ? closeMenuLabel : openMenuLabel}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="text-on-surface hover:bg-surface-container-low flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          {menuOpen ? (
            <X className="h-6 w-6" aria-hidden />
          ) : (
            <Menu className="h-6 w-6" aria-hidden />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-label text-label-bold text-primary truncate">
            {brand}
          </p>
          <p className="font-body text-body-md text-on-surface-variant truncate">
            {mobileTitle}
          </p>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label={closeMenuLabel}
          className="bg-inverse-surface/40 fixed inset-0 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "bg-surface-container-lowest border-outline-variant/30 fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r p-6 transition-transform lg:static lg:z-auto lg:w-60 lg:max-w-none lg:shrink-0 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-6 hidden lg:block">
          <p className="font-display text-headline-md text-primary">{brand}</p>
          <p className="font-label text-label-bold text-on-surface-variant mt-1">
            {subtitle}
          </p>
        </div>
        <AdminNav onNavigate={() => setMenuOpen(false)} />
      </aside>

      <main className="bg-background flex min-w-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}

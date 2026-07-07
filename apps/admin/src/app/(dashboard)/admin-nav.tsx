"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@de-tin-marin/shared/cn";
import { createAdminBrowserClient } from "@/shared/clients/supabase-browser";

const links = [
  { href: "/", labelKey: "dashboard" },
  { href: "/categories", labelKey: "categories" },
  { href: "/products", labelKey: "products" },
  { href: "/containers", labelKey: "containers" },
  { href: "/bundles", labelKey: "bundles" },
  { href: "/delivery", labelKey: "delivery" },
  { href: "/orders", labelKey: "orders" },
] as const;

type AdminNavProps = {
  onNavigate?: () => void;
};

export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  async function handleSignOut() {
    const supabase = createAdminBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="mt-8 flex flex-col gap-6">
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "font-label text-label-bold block rounded-full px-3 py-2 transition-colors",
                pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href))
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
              )}
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="font-body text-body-md text-on-surface-variant hover:text-on-surface text-left"
      >
        {tCommon("signOut")}
      </button>
    </nav>
  );
}

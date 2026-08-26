"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Candy,
  Gift,
  Layers,
  LayoutDashboard,
  LogOut,
  Palette,
  Receipt,
  Settings2,
  Shapes,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { createAdminBrowserClient } from "@/shared/clients/supabase-browser";
import { isAdminNavLinkActive } from "./admin-nav.helpers";

type NavLabelKey =
  | "dashboard"
  | "categories"
  | "products"
  | "containers"
  | "bundles"
  | "packs"
  | "delivery"
  | "businessSettings"
  | "storefrontSettings"
  | "webCustomization"
  | "orders";

type NavSectionKey = "overview" | "catalog" | "operations" | "store";

type NavLinkConfig = {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
};

type NavSectionConfig = {
  sectionKey: NavSectionKey;
  links: NavLinkConfig[];
};

const navSections: NavSectionConfig[] = [
  {
    sectionKey: "overview",
    links: [{ href: "/", labelKey: "dashboard", icon: LayoutDashboard }],
  },
  {
    sectionKey: "catalog",
    links: [
      { href: "/categories", labelKey: "categories", icon: Shapes },
      { href: "/products", labelKey: "products", icon: Candy },
      { href: "/containers", labelKey: "containers", icon: Box },
      { href: "/bundles", labelKey: "bundles", icon: Gift },
      { href: "/packs", labelKey: "packs", icon: Layers },
    ],
  },
  {
    sectionKey: "operations",
    links: [
      { href: "/orders", labelKey: "orders", icon: Receipt },
      { href: "/delivery", labelKey: "delivery", icon: Truck },
    ],
  },
  {
    sectionKey: "store",
    links: [
      {
        href: "/storefront-settings",
        labelKey: "storefrontSettings",
        icon: Store,
      },
      {
        href: "/business-settings",
        labelKey: "businessSettings",
        icon: Settings2,
      },
      {
        href: "/web-customization",
        labelKey: "webCustomization",
        icon: Palette,
      },
    ],
  },
];

type AdminNavProps = {
  onNavigate?: () => void;
};

function NavLinkItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "font-label text-label-bold group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
          active
            ? "bg-primary text-on-primary shadow-primary/15 shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-on-primary/15 text-on-primary"
              : "bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest group-hover:text-on-surface",
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

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
    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
        {navSections.map((section) => (
          <section
            key={section.sectionKey}
            aria-label={t(`sections.${section.sectionKey}`)}
          >
            <p className="font-label text-on-surface-variant/70 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em]">
              {t(`sections.${section.sectionKey}`)}
            </p>
            <ul className="space-y-1">
              {section.links.map((link) => (
                <NavLinkItem
                  key={link.href}
                  href={link.href}
                  label={t(link.labelKey)}
                  icon={link.icon}
                  active={isAdminNavLinkActive(pathname, link.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-outline-variant/30 shrink-0 border-t pt-4">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="font-label text-label-bold text-on-surface-variant hover:bg-error-container/40 hover:text-error group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
        >
          <span
            className="bg-surface-container-high group-hover:bg-error-container/60 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            aria-hidden
          >
            <LogOut className="h-4 w-4" strokeWidth={2.25} />
          </span>
          {tCommon("signOut")}
        </button>
      </div>
    </nav>
  );
}

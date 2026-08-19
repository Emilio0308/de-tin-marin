import {
  Candy,
  Gift,
  Heart,
  Layers,
  User,
  type LucideIcon,
} from "lucide-react";

export function getSiteNavLinkIcon(href: string): LucideIcon {
  if (href.includes("productos") || href.startsWith("/productos")) {
    return Candy;
  }

  if (href.includes("sorpresas") || href.startsWith("/sorpresas")) {
    return Gift;
  }

  if (href.includes("combos") || href.startsWith("/combos")) {
    return Layers;
  }

  if (href.includes("mis-pedidos")) {
    return User;
  }

  if (href.includes("nosotros")) {
    return Heart;
  }

  return Candy;
}

export function isCatalogNavLink(href: string): boolean {
  if (href.includes("tab=")) {
    return true;
  }

  return (
    href.startsWith("/productos") ||
    href.startsWith("/sorpresas") ||
    href.startsWith("/combos")
  );
}

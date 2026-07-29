export type HomeNavLabelKey =
  "sweets" | "surprises" | "combos" | "myOrders" | "about";

export interface HomeNavRoute {
  href: string;
  labelKey: HomeNavLabelKey;
}

export const HOME_NAV_ROUTES: HomeNavRoute[] = [
  { href: "/?tab=productos", labelKey: "sweets" },
  { href: "/?tab=sorpresas", labelKey: "surprises" },
  { href: "/?tab=combos", labelKey: "combos" },
  { href: "/mis-pedidos", labelKey: "myOrders" },
  { href: "/nosotros", labelKey: "about" },
];

export type HomeNavLabelKey = "sweets" | "surprises" | "myOrders" | "about";

export interface HomeNavRoute {
  href: string;
  labelKey: HomeNavLabelKey;
}

export const HOME_NAV_ROUTES: HomeNavRoute[] = [
  { href: "/?tab=productos", labelKey: "sweets" },
  { href: "/?tab=sorpresas", labelKey: "surprises" },
  { href: "/mis-pedidos", labelKey: "myOrders" },
  { href: "/nosotros", labelKey: "about" },
];

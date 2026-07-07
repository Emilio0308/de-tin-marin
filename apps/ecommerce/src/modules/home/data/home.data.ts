export type HomeNavLabelKey = "sweets" | "surprises" | "myOrders" | "about";

export interface HomeNavRoute {
  href: string;
  labelKey: HomeNavLabelKey;
}

export const HOME_NAV_ROUTES: HomeNavRoute[] = [
  { href: "/productos", labelKey: "sweets" },
  { href: "/sorpresas", labelKey: "surprises" },
  { href: "/mis-pedidos", labelKey: "myOrders" },
  { href: "#about", labelKey: "about" },
];

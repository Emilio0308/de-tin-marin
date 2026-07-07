export type HomeNavLabelKey = "sweets" | "surprises" | "about";

export interface HomeNavRoute {
  href: string;
  labelKey: HomeNavLabelKey;
}

export const HOME_NAV_ROUTES: HomeNavRoute[] = [
  { href: "/productos", labelKey: "sweets" },
  { href: "/sorpresas", labelKey: "surprises" },
  { href: "#about", labelKey: "about" },
];

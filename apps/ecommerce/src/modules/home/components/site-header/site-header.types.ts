import type { HomeNavLink } from "@/modules/home/types/home.types";

export interface SiteHeaderProps {
  navLinks: HomeNavLink[];
  /** Índice del link activo dentro de navLinks; -1 si ninguno aplica. */
  activeIndex: number;
  /** true cuando la página se ha desplazado (header compacto). */
  scrolled: boolean;
  cartCount: number;
}

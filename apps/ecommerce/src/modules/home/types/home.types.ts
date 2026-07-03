import type { LucideIcon } from "lucide-react";

export type HomeCategoryId =
  "caramelos" | "chocolates" | "gomitas" | "kits-fiesta" | "sorpresa";

export interface HomeCategory {
  id: HomeCategoryId;
  label: string;
  /** Icono de lucide-react asociado a la categoría. */
  icon: LucideIcon;
}

export interface HomeProduct {
  id: string;
  name: string;
  /** Precio en unidades monetarias (ej. 5.5 = $5.50). */
  price: number;
  imageUrl: string;
  imageAlt: string;
  /** Etiqueta opcional tipo "Nuevo" / "Sale". */
  badge?: string;
}

export interface HomeBundleFeature {
  id: string;
  label: string;
}

export interface HomeBundle {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  features: HomeBundleFeature[];
}

export interface HomeNavLink {
  label: string;
  href: string;
}

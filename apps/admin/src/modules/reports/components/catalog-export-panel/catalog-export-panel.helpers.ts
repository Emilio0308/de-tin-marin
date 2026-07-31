import type { CatalogStatusSection } from "@/modules/reports/schemas/export-catalog-status.schema";

export const ALL_CATALOG_SECTIONS: CatalogStatusSection[] = [
  "products",
  "bundles",
  "packs",
  "containers",
  "orders",
];

export function defaultSelectedSections(): Record<
  CatalogStatusSection,
  boolean
> {
  return {
    products: true,
    bundles: true,
    packs: true,
    containers: true,
    orders: true,
  };
}

export function selectedSectionsList(
  selected: Record<CatalogStatusSection, boolean>,
): CatalogStatusSection[] {
  return ALL_CATALOG_SECTIONS.filter((section) => selected[section]);
}

export function hasSelectedSection(
  selected: Record<CatalogStatusSection, boolean>,
): boolean {
  return selectedSectionsList(selected).length > 0;
}

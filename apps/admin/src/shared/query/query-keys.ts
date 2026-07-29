export const queryKeys = {
  catalog: {
    products: () => ["products"] as const,
    categories: () => ["categories"] as const,
    bundles: () => ["bundles"] as const,
    packs: () => ["packs"] as const,
    activeCampaigns: () => ["active-campaigns"] as const,
    surpriseContainers: () => ["surprise-containers"] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    detail: (id: string) => ["orders", id] as const,
  },
} as const;

export type AdminCatalogListKey = keyof typeof queryKeys.catalog;

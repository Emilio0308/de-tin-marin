export const queryKeys = {
  catalog: {
    products: (status?: "all" | "active" | "inactive") =>
      status === undefined
        ? (["products"] as const)
        : (["products", status] as const),
    productsPage: (query: unknown) => ["products", "page", query] as const,
    categories: () => ["categories"] as const,
    categoriesPage: (query: unknown) => ["categories", "page", query] as const,
    bundles: () => ["bundles"] as const,
    bundlesPage: (query: unknown) => ["bundles", "page", query] as const,
    packs: () => ["packs"] as const,
    packsPage: (query: unknown) => ["packs", "page", query] as const,
    activeCampaigns: () => ["active-campaigns"] as const,
    surpriseContainers: () => ["surprise-containers"] as const,
    surpriseContainersPage: (query: unknown) =>
      ["surprise-containers", "page", query] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    list: (query: unknown) => ["orders", "list", query] as const,
    detail: (id: string) => ["orders", id] as const,
  },
} as const;

/** Keys used by invalidateAdminCatalogLists (prefix match covers *Page variants). */
export type AdminCatalogListKey =
  | "products"
  | "categories"
  | "bundles"
  | "packs"
  | "activeCampaigns"
  | "surpriseContainers";

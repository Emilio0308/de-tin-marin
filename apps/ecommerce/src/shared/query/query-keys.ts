export const queryKeys = {
  catalog: {
    all: ["catalog"] as const,
    products: () => [...queryKeys.catalog.all, "products"] as const,
    productsList: (query: Record<string, unknown>) =>
      [...queryKeys.catalog.products(), "list", query] as const,
    productDetail: (slug: string) =>
      [...queryKeys.catalog.products(), "detail", slug] as const,
    bundles: () => [...queryKeys.catalog.all, "bundles"] as const,
    bundlesList: (query: Record<string, unknown>) =>
      [...queryKeys.catalog.bundles(), "list", query] as const,
    bundleDetail: (id: string) =>
      [...queryKeys.catalog.bundles(), "detail", id] as const,
    categories: () => [...queryKeys.catalog.all, "categories"] as const,
  },
  cart: {
    all: ["cart"] as const,
    current: () => [...queryKeys.cart.all, "current"] as const,
  },
  orders: {
    all: ["orders"] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
} as const;

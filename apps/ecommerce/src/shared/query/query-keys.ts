export const queryKeys = {
  catalog: {
    all: ["catalog"] as const,
    products: () => [...queryKeys.catalog.all, "products"] as const,
    bundles: () => [...queryKeys.catalog.all, "bundles"] as const,
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

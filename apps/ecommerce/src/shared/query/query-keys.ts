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
    lineImages: (cartLineIds: string[]) =>
      [...queryKeys.cart.all, "line-images", cartLineIds] as const,
    productMeta: (cartLineIds: string[]) =>
      [...queryKeys.cart.all, "product-meta", cartLineIds] as const,
  },
  wizard: {
    all: ["wizard"] as const,
    template: (bundleId: string) =>
      [...queryKeys.wizard.all, "template", bundleId] as const,
    preview: (bundleId: string, components: unknown) =>
      [...queryKeys.wizard.all, "preview", bundleId, components] as const,
    productSearch: (search: string) =>
      [...queryKeys.wizard.all, "product-search", search] as const,
  },
  orders: {
    all: ["orders"] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    guestLookup: (orderNumber: string, email: string) =>
      [...queryKeys.orders.all, "guest-lookup", orderNumber, email] as const,
  },
  checkout: {
    all: ["checkout"] as const,
    deliveryFee: (district: string, mapPin: { lat: number; lng: number }) =>
      [...queryKeys.checkout.all, "delivery-fee", district, mapPin] as const,
    stock: (lines: unknown) =>
      [...queryKeys.checkout.all, "stock", lines] as const,
  },
  delivery: {
    all: ["delivery"] as const,
    zones: () => [...queryKeys.delivery.all, "zones"] as const,
  },
} as const;

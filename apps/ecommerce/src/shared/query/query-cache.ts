/** 15 minutes — catálogo y navegación (DECISIONS #32, rules/50). */
export const CATALOG_QUERY_CACHE_MS = 15 * 60 * 1000;

/** Carrito, checkout y preview de precio/stock: siempre fresco. */
export const freshQueryOptions = {
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: true,
} as const;

/** Preview de precios en carrito/checkout: refetch periódico mientras la pestaña está activa. */
export const cartCheckoutPreviewOptions = {
  ...freshQueryOptions,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
} as const;

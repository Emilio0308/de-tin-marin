/** 24 hours — fallback default / admin-style TTL when version gate is not used. */
export const CATALOG_QUERY_CACHE_MS = 24 * 60 * 60 * 1000;

/** Listados ecommerce: frescura vía catalog_version, no TTL corto. */
export const catalogQueryOptions = {
  staleTime: Infinity,
  gcTime: CATALOG_QUERY_CACHE_MS,
} as const;

/** Carrito sync, fee checkout y preview: siempre fresco. */
export const freshQueryOptions = {
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: true,
} as const;

/** @deprecated Prefer freshQueryOptions — polling 30s eliminado (validate al submit). */
export const cartCheckoutPreviewOptions = {
  ...freshQueryOptions,
} as const;

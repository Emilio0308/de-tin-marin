import type { QueryClient } from "@tanstack/react-query";
import { queryKeys, type AdminCatalogListKey } from "./query-keys";

/** 15 minutes — listados admin y catálogo auxiliar (DECISIONS #32, rules/50). */
export const CATALOG_QUERY_CACHE_MS = 15 * 60 * 1000;

/** Preview de precio/stock en order-form: siempre fresco. */
export const freshQueryOptions = {
  staleTime: 0,
  gcTime: 0,
} as const;

/** Tras mutar en formularios/listados: forzar refetch aunque staleTime sea 15 min. */
export async function invalidateAdminCatalogLists(
  queryClient: QueryClient,
  ...keys: AdminCatalogListKey[]
) {
  await Promise.all(
    keys.map((key) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalog[key](),
        refetchType: "all",
      }),
    ),
  );
}

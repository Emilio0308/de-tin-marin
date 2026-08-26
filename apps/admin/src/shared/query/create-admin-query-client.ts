import { QueryClient } from "@tanstack/react-query";
import { CATALOG_QUERY_CACHE_MS } from "./query-cache";

export function createAdminQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CATALOG_QUERY_CACHE_MS,
        gcTime: CATALOG_QUERY_CACHE_MS,
      },
    },
  });
}

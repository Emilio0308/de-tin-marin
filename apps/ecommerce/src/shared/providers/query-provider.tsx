"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { CATALOG_QUERY_CACHE_MS } from "@/shared/query/query-cache";
import { useCatalogVersionGate } from "@/shared/query/use-catalog-version-gate";

function CatalogVersionGate() {
  useCatalogVersionGate();
  return null;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CATALOG_QUERY_CACHE_MS,
            gcTime: CATALOG_QUERY_CACHE_MS,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <CatalogVersionGate />
      {children}
    </QueryClientProvider>
  );
}

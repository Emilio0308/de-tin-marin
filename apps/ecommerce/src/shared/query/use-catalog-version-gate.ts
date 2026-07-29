"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CATALOG_VERSION_EVENT,
  CATALOG_VERSION_TOPIC,
} from "@de-tin-marin/shared/catalog-version";
import { getCatalogVersionAction } from "@/modules/catalog/actions/get-catalog-version";
import { createEcommerceBrowserClient } from "@/shared/clients/supabase-browser";
import { queryKeys } from "@/shared/query/query-keys";

const STORAGE_KEY = "dtm-catalog-version";

function readStoredVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredVersion(versionAt: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, versionAt);
  } catch {
    // ignore quota / private mode
  }
}

function isCatalogListQuery(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "catalog" && queryKey[1] !== "version";
}

function invalidateCatalogLists(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  void queryClient.invalidateQueries({
    predicate: (query) => isCatalogListQuery(query.queryKey),
    refetchType: "all",
  });
}

function applyVersion(
  versionAt: string,
  lastSeenRef: { current: string | null },
  queryClient: ReturnType<typeof useQueryClient>,
  options?: { invalidateIfChangedFromStored?: boolean },
): void {
  const previous = lastSeenRef.current;
  const stored = readStoredVersion();

  if (previous === null) {
    lastSeenRef.current = stored ?? versionAt;
    writeStoredVersion(versionAt);
    if (
      options?.invalidateIfChangedFromStored &&
      stored !== null &&
      stored !== versionAt
    ) {
      lastSeenRef.current = versionAt;
      invalidateCatalogLists(queryClient);
    }
    return;
  }

  if (previous !== versionAt) {
    lastSeenRef.current = versionAt;
    writeStoredVersion(versionAt);
    invalidateCatalogLists(queryClient);
    void queryClient.setQueryData(queryKeys.catalog.version(), versionAt);
  }
}

/**
 * Seeds catalog version once, then listens for Realtime Broadcast on
 * `catalog-version`. No polling — invalidates listados only when admin bumps.
 * Visibility/focus does a single version check as a safety net if the WS dropped.
 */
export function useCatalogVersionGate() {
  const queryClient = useQueryClient();
  const lastSeenRef = useRef<string | null>(null);

  const versionQuery = useQuery({
    queryKey: queryKeys.catalog.version(),
    queryFn: async () => {
      const result = await getCatalogVersionAction();
      if (!result.ok) throw new Error(result.error);
      return result.data.versionAt;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!versionQuery.data) return;
    applyVersion(versionQuery.data, lastSeenRef, queryClient, {
      invalidateIfChangedFromStored: true,
    });
  }, [queryClient, versionQuery.data]);

  useEffect(() => {
    const supabase = createEcommerceBrowserClient();
    const channel = supabase
      .channel(CATALOG_VERSION_TOPIC)
      .on(
        "broadcast",
        { event: CATALOG_VERSION_EVENT },
        (message: { payload?: { versionAt?: unknown } }) => {
          const versionAt = message.payload?.versionAt;
          if (typeof versionAt !== "string" || versionAt.length === 0) return;
          applyVersion(versionAt, lastSeenRef, queryClient);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.version(),
        refetchType: "active",
      });
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [queryClient]);
}

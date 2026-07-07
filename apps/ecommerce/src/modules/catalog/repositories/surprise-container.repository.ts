import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Json } from "@de-tin-marin/types/database";
import { parseContainerPricesJson } from "@de-tin-marin/shared/prices";

type ContainerRow = {
  id: string;
  name: string;
  prices: Json;
};

export async function getActiveContainersByIdsRepo(
  config: SupabaseConfig,
  ids: string[],
): Promise<ContainerRow[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .select("id, name, prices")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function getContainerNetPrice(container: ContainerRow | undefined): {
  name: string;
  netPrice: number;
} {
  if (!container) {
    return { name: "—", netPrice: 0 };
  }

  return {
    name: container.name,
    netPrice: parseContainerPricesJson(container.prices).netPrice,
  };
}

import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Json } from "@de-tin-marin/types/database";

export type WizardProductRow = {
  id: string;
  sku: string;
  name: string;
  prices: Json;
  campaign_id: string | null;
  items_per_package: number;
  is_active: boolean;
};

export type WizardCampaignRow = {
  id: string;
  percentage: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export async function getWizardProductsByIdsRepo(
  config: SupabaseConfig,
  productIds: string[],
): Promise<WizardProductRow[]> {
  if (productIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select("id, sku, name, prices, campaign_id, items_per_package, is_active")
    .in("id", productIds)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listWizardCampaignsByIdsRepo(
  config: SupabaseConfig,
  ids: string[],
): Promise<WizardCampaignRow[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("campaigns")
    .select("id, percentage, starts_at, ends_at, is_active")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return data ?? [];
}

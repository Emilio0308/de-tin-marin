import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

export type WizardProductStockRow = {
  id: string;
  sku: string;
  name: string;
  stock_sealed_packages: number;
  stock_loose_base_units: number;
  items_per_package: number;
};

export type WizardContainerStockRow = {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
};

export async function getWizardProductStockByIdsRepo(
  config: SupabaseConfig,
  productIds: string[],
): Promise<WizardProductStockRow[]> {
  if (productIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select(
      "id, sku, name, stock_sealed_packages, stock_loose_base_units, items_per_package",
    )
    .in("id", productIds);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWizardContainerStockByIdsRepo(
  config: SupabaseConfig,
  containerIds: string[],
): Promise<WizardContainerStockRow[]> {
  if (containerIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .select("id, sku, name, stock_quantity")
    .in("id", containerIds);

  if (error) throw new Error(error.message);
  return data ?? [];
}

"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  deleteDeliveryZoneService,
  getDeliverySettingsService,
  listDeliveryZonesService,
  resolveDeliveryFeeService,
  updateDeliverySettingsService,
  upsertDeliveryZoneService,
} from "@/modules/delivery/services/delivery.service";

export async function listDeliveryZonesAction() {
  return guardAction("listDeliveryZonesAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await listDeliveryZonesService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function getDeliverySettingsAction() {
  return guardAction("getDeliverySettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await getDeliverySettingsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function upsertDeliveryZoneAction(raw: unknown) {
  return guardAction("upsertDeliveryZoneAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const result = await upsertDeliveryZoneService(supabaseConfig, raw);
    return result;
  });
}

export async function deleteDeliveryZoneAction(id: string) {
  return guardAction("deleteDeliveryZoneAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return deleteDeliveryZoneService(supabaseConfig, id);
  });
}

export async function updateDeliverySettingsAction(raw: unknown) {
  return guardAction("updateDeliverySettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return updateDeliverySettingsService(supabaseConfig, raw);
  });
}

export async function resolveDeliveryFeeAction(raw: unknown) {
  return guardAction("resolveDeliveryFeeAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return resolveDeliveryFeeService(supabaseConfig, raw);
  });
}

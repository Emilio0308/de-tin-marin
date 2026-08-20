"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import {
  guardAction,
  summarizeActionInput,
} from "@/shared/errors/server-error";
import {
  deletePickupPointService,
  listPickupPointsService,
  upsertPickupPointService,
} from "@/modules/delivery/services/pickup-point.service";

export async function listPickupPointsAction() {
  return guardAction(
    "listPickupPointsAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      const data = await listPickupPointsService(supabaseConfig);
      return { ok: true as const, data };
    },
    { operation: "list_pickup_points" },
  );
}

export async function upsertPickupPointAction(raw: unknown) {
  return guardAction(
    "upsertPickupPointAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      return upsertPickupPointService(supabaseConfig, raw);
    },
    summarizeActionInput(raw),
  );
}

export async function deletePickupPointAction(id: string) {
  return guardAction(
    "deletePickupPointAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      return deletePickupPointService(supabaseConfig, id);
    },
    { id },
  );
}

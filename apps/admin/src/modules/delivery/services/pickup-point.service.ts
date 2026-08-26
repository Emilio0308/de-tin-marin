import "server-only";

import { pickupPointInputSchema } from "@de-tin-marin/validations/pickup-point";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { logServerError, logServerInfo } from "@/shared/errors/server-error";
import {
  deletePickupPointRepo,
  listPickupPointsRepo,
  upsertPickupPointRepo,
} from "../repositories/pickup-point.repository";
import type { PickupPointDTO } from "../types/delivery.dto";

function toPickupPointDTO(
  row: Awaited<ReturnType<typeof listPickupPointsRepo>>[number],
): PickupPointDTO {
  return {
    id: row.id,
    name: row.name,
    lat: Number(row.lat),
    lng: Number(row.lng),
    fee: Number(row.fee),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function listPickupPointsService(
  config: SupabaseConfig,
): Promise<PickupPointDTO[]> {
  const scope = "listPickupPointsService";
  logServerInfo(scope, "start");
  const rows = await listPickupPointsRepo(config);
  logServerInfo(scope, "ok", { itemCount: rows.length });
  return rows.map(toPickupPointDTO);
}

export async function upsertPickupPointService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const scope = "upsertPickupPointService";
  const parsed = pickupPointInputSchema.safeParse(raw);
  if (!parsed.success) {
    logServerError(scope, {
      message: "VALIDATION",
      issueCount: parsed.error.issues.length,
    });
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  try {
    const row = await upsertPickupPointRepo(config, {
      id: data.id,
      name: data.name.trim(),
      lat: data.lat,
      lng: data.lng,
      fee: data.fee,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    });
    logServerInfo(scope, "saved", { pickupPointId: row.id });
    return { ok: true as const, id: row.id };
  } catch (error) {
    logServerError(scope, {
      message: error instanceof Error ? error.message : "UPSERT_FAILED",
      pickupPointId: data.id,
    });
    return { ok: false as const, error: "UPSERT_FAILED" as const };
  }
}

export async function deletePickupPointService(
  config: SupabaseConfig,
  id: string,
) {
  const scope = "deletePickupPointService";
  await deletePickupPointRepo(config, id);
  logServerInfo(scope, "deleted", { pickupPointId: id });
  return { ok: true as const };
}

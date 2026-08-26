import "server-only";

import { listEnabledCheckoutCourierDepartments } from "@de-tin-marin/shared/courier-coverage";
import {
  buildDefaultCourierProvinces,
  findCourierCatalogDepartment,
} from "@de-tin-marin/shared/courier-provinces-catalog";
import {
  courierProvinceSchema,
  createCourierDepartmentInputSchema,
  updateCourierDepartmentInputSchema,
} from "@de-tin-marin/validations/courier";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  createCourierDepartmentRepo,
  getCourierDepartmentByIdRepo,
  getCourierDepartmentByNameRepo,
  listActiveCourierDepartmentsRepo,
  listCourierDepartmentsRepo,
  updateCourierDepartmentRepo,
} from "../repositories/courier.repository";
import type { CourierDepartmentDTO } from "../types/delivery.dto";
import { logServerError, logServerInfo } from "@/shared/errors/server-error";

function parseProvinces(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const provinces = [];
  for (const item of raw) {
    const parsed = courierProvinceSchema.safeParse(item);
    if (parsed.success) provinces.push(parsed.data);
  }
  return provinces;
}

function toCourierDepartmentDTO(
  row: Awaited<ReturnType<typeof listCourierDepartmentsRepo>>[number],
): CourierDepartmentDTO {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    provinces: parseProvinces(row.provinces),
  };
}

export async function listCourierDepartmentsService(
  config: SupabaseConfig,
): Promise<CourierDepartmentDTO[]> {
  const rows = await listCourierDepartmentsRepo(config);
  return rows.map(toCourierDepartmentDTO);
}

export async function listCheckoutCourierDestinationsService(
  config: SupabaseConfig,
  courierEnabled: boolean,
) {
  if (!courierEnabled) {
    return { ok: true as const, data: [] };
  }

  const rows = await listActiveCourierDepartmentsRepo(config);
  const departments = rows.map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    provinces: parseProvinces(row.provinces),
  }));

  return {
    ok: true as const,
    data: listEnabledCheckoutCourierDepartments(departments),
  };
}

export async function updateCourierDepartmentService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const scope = "updateCourierDepartmentService";
  const parsed = updateCourierDepartmentInputSchema.safeParse(raw);
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

  const existing = await getCourierDepartmentByIdRepo(config, parsed.data.id);
  if (!existing) {
    logServerError(scope, {
      message: "NOT_FOUND",
      departmentId: parsed.data.id,
    });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const updateRow: {
    is_active?: boolean;
    provinces?: ReturnType<typeof parseProvinces>;
  } = {};

  if (parsed.data.isActive !== undefined) {
    updateRow.is_active = parsed.data.isActive;
  }
  if (parsed.data.provinces) {
    updateRow.provinces = parsed.data.provinces;
  }

  const row = await updateCourierDepartmentRepo(
    config,
    parsed.data.id,
    updateRow,
  );

  logServerInfo(scope, "updated", { departmentId: row.id });
  return { ok: true as const, data: toCourierDepartmentDTO(row) };
}

export async function createCourierDepartmentService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const scope = "createCourierDepartmentService";
  const parsed = createCourierDepartmentInputSchema.safeParse(raw);
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

  const catalogEntry = findCourierCatalogDepartment(parsed.data.name);
  if (!catalogEntry) {
    logServerError(scope, {
      message: "NOT_IN_CATALOG",
      name: parsed.data.name,
    });
    return { ok: false as const, error: "NOT_IN_CATALOG" as const };
  }

  const existing = await getCourierDepartmentByNameRepo(
    config,
    catalogEntry.name,
  );
  if (existing) {
    logServerError(scope, {
      message: "DUPLICATE",
      name: catalogEntry.name,
    });
    return { ok: false as const, error: "DUPLICATE" as const };
  }

  const row = await createCourierDepartmentRepo(config, {
    name: catalogEntry.name,
    provinces: buildDefaultCourierProvinces(catalogEntry.provinces),
    is_active: false,
    sort_order: catalogEntry.sortOrder,
  });

  logServerInfo(scope, "created", { departmentId: row.id, name: row.name });
  return { ok: true as const, data: toCourierDepartmentDTO(row) };
}

export function mapCourierDepartmentRows(
  rows: Awaited<ReturnType<typeof listCourierDepartmentsRepo>>,
): CourierDepartmentDTO[] {
  return rows.map(toCourierDepartmentDTO);
}

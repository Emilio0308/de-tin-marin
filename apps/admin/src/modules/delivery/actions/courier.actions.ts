"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import {
  guardAction,
  summarizeActionInput,
} from "@/shared/errors/server-error";
import {
  createCourierDepartmentService,
  listCourierDepartmentsService,
  updateCourierDepartmentService,
} from "@/modules/delivery/services/courier.service";

export async function listCourierDepartmentsAction() {
  return guardAction(
    "listCourierDepartmentsAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      const data = await listCourierDepartmentsService(supabaseConfig);
      return { ok: true as const, data };
    },
    { operation: "list_courier_departments" },
  );
}

export async function createCourierDepartmentAction(raw: unknown) {
  return guardAction(
    "createCourierDepartmentAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      return createCourierDepartmentService(supabaseConfig, raw);
    },
    summarizeActionInput(raw),
  );
}

export async function updateCourierDepartmentAction(raw: unknown) {
  return guardAction(
    "updateCourierDepartmentAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      return updateCourierDepartmentService(supabaseConfig, raw);
    },
    summarizeActionInput(raw),
  );
}

import "server-only";

import type { User } from "@supabase/supabase-js";
import { getUser, createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { logServerError } from "@/shared/errors/server-error";

export type StaffSession = {
  userId: string;
  role: "admin" | "super_admin";
};

export type RequireStaffResult =
  | { ok: true; staff: StaffSession }
  | { ok: false; error: "UNAUTHORIZED" | "FORBIDDEN" };

export async function requireStaff(
  config: SupabaseConfig,
): Promise<RequireStaffResult> {
  const user = await getUser(config);
  if (!user) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("core")
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logServerError("requireStaff:user_roles", error);
    return { ok: false, error: "FORBIDDEN" };
  }

  if (!data) {
    logServerError(
      "requireStaff:no-role",
      `El usuario ${user.id} no tiene fila en core.user_roles`,
    );
    return { ok: false, error: "FORBIDDEN" };
  }

  return {
    ok: true,
    staff: { userId: user.id, role: data.role as StaffSession["role"] },
  };
}

export async function getSessionUser(
  config: SupabaseConfig,
): Promise<User | null> {
  return getUser(config);
}

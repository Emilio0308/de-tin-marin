import "server-only";

import type { User } from "@supabase/supabase-js";
import { getUser, createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

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

  if (error || !data) {
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

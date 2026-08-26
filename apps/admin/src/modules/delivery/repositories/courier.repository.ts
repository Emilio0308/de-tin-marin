import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type CourierDepartmentRow =
  Database["pricing"]["Tables"]["courier_departments"]["Row"];
type CourierDepartmentInsert =
  Database["pricing"]["Tables"]["courier_departments"]["Insert"];
type CourierDepartmentUpdate =
  Database["pricing"]["Tables"]["courier_departments"]["Update"];

export async function listCourierDepartmentsRepo(
  config: SupabaseConfig,
): Promise<CourierDepartmentRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("courier_departments")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CourierDepartmentRow[];
}

export async function listActiveCourierDepartmentsRepo(
  config: SupabaseConfig,
): Promise<CourierDepartmentRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("courier_departments")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CourierDepartmentRow[];
}

export async function getCourierDepartmentByNameRepo(
  config: SupabaseConfig,
  name: string,
): Promise<CourierDepartmentRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("courier_departments")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? null) as CourierDepartmentRow | null;
}

export async function createCourierDepartmentRepo(
  config: SupabaseConfig,
  row: CourierDepartmentInsert,
): Promise<CourierDepartmentRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("courier_departments")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as CourierDepartmentRow;
}

export async function getCourierDepartmentByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<CourierDepartmentRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("courier_departments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? null) as CourierDepartmentRow | null;
}

export async function updateCourierDepartmentRepo(
  config: SupabaseConfig,
  id: string,
  row: CourierDepartmentUpdate,
): Promise<CourierDepartmentRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("courier_departments")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as CourierDepartmentRow;
}

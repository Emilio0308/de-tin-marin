import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseConfig } from "./config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createSupabaseServerClient(config: SupabaseConfig) {
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // RSC read-only cookies — safe when proxy refreshes session
        }
      },
    },
  });
}

export async function getUser(config: SupabaseConfig) {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

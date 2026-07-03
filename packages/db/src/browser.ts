import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseConfig } from "./config";

export function createSupabaseBrowserClient(config: SupabaseConfig) {
  return createBrowserClient(config.url, config.publishableKey);
}

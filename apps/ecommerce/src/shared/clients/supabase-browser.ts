"use client";

import { createSupabaseBrowserClient } from "@de-tin-marin/db/browser";
import { supabaseConfig } from "@/config/env";

export function createEcommerceBrowserClient() {
  return createSupabaseBrowserClient(supabaseConfig);
}

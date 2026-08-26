"use server";

import { supabaseConfig } from "@/config/env";
import {
  guardAction,
  summarizeActionInput,
} from "@/shared/errors/server-error";
import { getCartLineMetaService } from "../services/public-catalog.service";

export async function getCartLineMetaAction(raw: unknown) {
  return guardAction(
    "getCartLineMetaAction",
    async () => {
      const result = await getCartLineMetaService(supabaseConfig, raw);
      if (!result.ok) return { ok: false as const, error: result.error };
      return { ok: true as const, data: result.data };
    },
    summarizeActionInput(raw),
  );
}

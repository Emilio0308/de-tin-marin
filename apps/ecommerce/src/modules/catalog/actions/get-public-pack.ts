"use server";

import { supabaseConfig } from "@/config/env";
import {
  guardAction,
  summarizeActionInput,
} from "@/shared/errors/server-error";
import { getPublicPackService } from "../services/public-catalog.service";

export async function getPublicPackAction(raw: unknown) {
  return guardAction(
    "getPublicPackAction",
    async () => {
      const result = await getPublicPackService(supabaseConfig, raw);
      if (!result.ok) return { ok: false as const, error: result.error };
      return { ok: true as const, data: result.data };
    },
    summarizeActionInput(raw),
  );
}

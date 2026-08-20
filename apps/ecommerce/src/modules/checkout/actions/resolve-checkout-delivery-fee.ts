"use server";

import { supabaseConfig } from "@/config/env";
import {
  guardAction,
  summarizeActionInput,
} from "@/shared/errors/server-error";
import { resolveCheckoutFulfillmentFeeService } from "../services/checkout-delivery.service";

export async function resolveCheckoutDeliveryFeeAction(raw: unknown) {
  return guardAction(
    "resolveCheckoutDeliveryFeeAction",
    async () => {
      const result = await resolveCheckoutFulfillmentFeeService(
        supabaseConfig,
        raw,
      );
      if (!result.ok) return { ok: false as const, error: result.error };
      return { ok: true as const, data: result.data };
    },
    summarizeActionInput(raw),
  );
}

"use server";

import { supabaseConfig } from "@/config/env";
import {
  guardAction,
  logServerError,
  logServerInfo,
} from "@/shared/errors/server-error";
import { createGuestOrderService } from "../services/guest-order.service";

export async function createGuestOrderAction(raw: unknown) {
  return guardAction("createGuestOrderAction", async () => {
    logServerInfo("createGuestOrderAction", "invoked");
    const result = await createGuestOrderService(supabaseConfig, raw);
    if (!result.ok) {
      logServerError("createGuestOrderAction", {
        message: result.error,
      });
      return { ok: false as const, error: result.error };
    }
    logServerInfo("createGuestOrderAction", "success", {
      orderNumber: result.data.orderNumber,
    });
    return { ok: true as const, data: result.data };
  });
}

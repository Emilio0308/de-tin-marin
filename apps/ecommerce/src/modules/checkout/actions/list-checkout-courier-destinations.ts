"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listCheckoutCourierDestinationsService } from "../services/checkout-delivery.service";

export async function listCheckoutCourierDestinationsAction() {
  return guardAction(
    "listCheckoutCourierDestinationsAction",
    async () => {
      const result =
        await listCheckoutCourierDestinationsService(supabaseConfig);
      return result;
    },
    { operation: "list_checkout_courier_destinations" },
  );
}

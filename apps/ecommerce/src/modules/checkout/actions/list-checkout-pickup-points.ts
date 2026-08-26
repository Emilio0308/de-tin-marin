"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listCheckoutPickupPointsService } from "../services/checkout-delivery.service";

export async function listCheckoutPickupPointsAction() {
  return guardAction(
    "listCheckoutPickupPointsAction",
    async () => {
      const result = await listCheckoutPickupPointsService(supabaseConfig);
      return result;
    },
    { operation: "list_checkout_pickup_points" },
  );
}

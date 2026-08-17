"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listCheckoutDeliveryZonesService } from "../services/checkout-delivery.service";

export async function listCheckoutDeliveryZonesAction() {
  return guardAction(
    "listCheckoutDeliveryZonesAction",
    async () => listCheckoutDeliveryZonesService(supabaseConfig),
    { operation: "list_delivery_zones" },
  );
}

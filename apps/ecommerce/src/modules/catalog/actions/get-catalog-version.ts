"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getCatalogVersionService } from "../services/catalog-version.service";

export async function getCatalogVersionAction() {
  return guardAction(
    "getCatalogVersionAction",
    async () => {
      return getCatalogVersionService(supabaseConfig);
    },
    { operation: "getCatalogVersionAction" },
  );
}

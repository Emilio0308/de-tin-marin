"use server";

import type { HealthDTO } from "@de-tin-marin/validations/health";

export async function getHealth(): Promise<HealthDTO> {
  return Promise.resolve({ status: "ok", app: "admin" });
}

import { z } from "zod";

export const healthSchema = z.object({
  status: z.literal("ok"),
  app: z.enum(["ecommerce", "admin"]),
});

export type HealthDTO = z.infer<typeof healthSchema>;

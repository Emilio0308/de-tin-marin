import { z } from "zod";
import { priceNormalSchema } from "./prices";

export const surpriseContainerPricesSchema = priceNormalSchema;

export const createSurpriseContainerInputSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  netPrice: z.number().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

export const updateSurpriseContainerInputSchema =
  createSurpriseContainerInputSchema.partial().extend({
    id: z.string().uuid(),
  });

export const surpriseContainerListItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  netPrice: z.number(),
  stockQuantity: z.number(),
  isActive: z.boolean(),
});

export type CreateSurpriseContainerInput = z.infer<
  typeof createSurpriseContainerInputSchema
>;
export type UpdateSurpriseContainerInput = z.infer<
  typeof updateSurpriseContainerInputSchema
>;
export type SurpriseContainerListItem = z.infer<
  typeof surpriseContainerListItemSchema
>;

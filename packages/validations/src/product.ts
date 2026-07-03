import { z } from "zod";
import { netPriceInputSchema } from "./prices";

const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const createProductInputSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  slug: slugSchema,
  brand: z.string().max(120).optional().nullable(),
  netPrice: netPriceInputSchema,
  stockQuantity: z.number().int().nonnegative().default(0),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateProductInputSchema = createProductInputSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export const productCampaignSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    percentage: z.number(),
  })
  .nullable();

export const productListItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  slug: z.string(),
  brand: z.string().nullable(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  netPrice: z.number(),
  finalPrice: z.number(),
  campaign: productCampaignSummarySchema,
  stockQuantity: z.number(),
  isActive: z.boolean(),
  imageUrl: z.string().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type ProductListItem = z.infer<typeof productListItemSchema>;

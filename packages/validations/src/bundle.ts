import { z } from "zod";

export const bundleItemInputSchema = z.object({
  productId: z.string().uuid(),
  unitsPerPerson: z.number().int().min(1).default(1),
});

export const createBundleInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  serviceFee: z.number().nonnegative(),
  quantity: z.number().int().min(1),
  isActive: z.boolean().default(true),
  items: z.array(bundleItemInputSchema).min(1),
});

export const updateBundleInputSchema = createBundleInputSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export const bundleListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  serviceFee: z.number(),
  quantity: z.number(),
  itemCount: z.number(),
  total: z.number(),
  isActive: z.boolean(),
});

export type BundleItemInput = z.infer<typeof bundleItemInputSchema>;
export type CreateBundleInput = z.infer<typeof createBundleInputSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleInputSchema>;
export type BundleListItem = z.infer<typeof bundleListItemSchema>;

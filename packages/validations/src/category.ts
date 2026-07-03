import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  slug: slugSchema,
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategoryInputSchema = createCategoryInputSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export const categoryListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  description: z.string().nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;
export type CategoryListItem = z.infer<typeof categoryListItemSchema>;

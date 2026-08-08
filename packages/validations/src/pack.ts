import { z } from "zod";

export const packItemInputSchema = z
  .object({
    productId: z.string().uuid(),
    packageQuantity: z.number().int().min(0).default(0),
    unitQuantity: z.number().int().min(0).default(0),
  })
  .superRefine((item, ctx) => {
    if (item.packageQuantity + item.unitQuantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "packageQuantity + unitQuantity must be >= 1",
        path: ["unitQuantity"],
      });
    }
  });

const packFieldsSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  slug: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  normalNetPrice: z.number().nonnegative(),
  campaignId: z.string().uuid().optional().nullable(),
  purchaseMinQuantity: z.number().int().min(1).default(1),
  purchaseMaxQuantity: z.number().int().min(1).default(100),
  isActive: z.boolean().default(true),
  items: z.array(packItemInputSchema).min(1),
});

function refinePurchaseMinMax(
  value: { purchaseMinQuantity?: number; purchaseMaxQuantity?: number },
  ctx: z.RefinementCtx,
) {
  const min = value.purchaseMinQuantity;
  const max = value.purchaseMaxQuantity;
  if (min !== undefined && max !== undefined && max < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "purchaseMaxQuantity must be >= purchaseMinQuantity",
      path: ["purchaseMaxQuantity"],
    });
  }
}

export const createPackInputSchema =
  packFieldsSchema.superRefine(refinePurchaseMinMax);

export const updatePackInputSchema = packFieldsSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine(refinePurchaseMinMax);

export const packListItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  normalPrice: z.number(),
  referencePrice: z.number(),
  finalPrice: z.number(),
  itemCount: z.number(),
  availableQuantity: z.number().int().min(0),
  stockShortages: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      sku: z.string(),
      availableCombos: z.number().int().min(0),
      reason: z.enum(["missing_product", "inactive", "insufficient_stock"]),
    }),
  ),
  purchaseMinQuantity: z.number(),
  purchaseMaxQuantity: z.number(),
  isActive: z.boolean(),
  campaign: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      percentage: z.number(),
    })
    .nullable()
    .optional(),
});

export type PackItemInput = z.infer<typeof packItemInputSchema>;
export type CreatePackInput = z.infer<typeof createPackInputSchema>;
export type UpdatePackInput = z.infer<typeof updatePackInputSchema>;
export type PackListItem = z.infer<typeof packListItemSchema>;

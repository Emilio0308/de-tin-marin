import { z } from "zod";
import { netPriceInputSchema } from "./prices";

const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const productTypeSchema = z.enum(["unit", "package"]);

const productFieldsSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  slug: slugSchema,
  brand: z.string().max(120).optional().nullable(),
  productType: productTypeSchema.default("unit"),
  itemsPerPackage: z.number().int().min(1).default(1),
  packageLabel: z.string().max(40).optional().nullable(),
  packageNetPrice: netPriceInputSchema,
  stockSealedPackages: z.number().int().nonnegative().default(0),
  stockLooseBaseUnits: z.number().int().nonnegative().default(0),
  purchaseMinQuantity: z.number().int().min(1).default(10),
  purchaseMaxQuantity: z.number().int().min(1).default(100),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});

function refineProductPresentation(
  data: {
    productType?: "unit" | "package";
    itemsPerPackage?: number;
    purchaseMinQuantity?: number;
    purchaseMaxQuantity?: number;
  },
  ctx: z.RefinementCtx,
) {
  if (
    data.productType === "unit" &&
    data.itemsPerPackage !== undefined &&
    data.itemsPerPackage !== 1
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unit products must have itemsPerPackage = 1",
      path: ["itemsPerPackage"],
    });
  }
  if (
    data.productType === "package" &&
    data.itemsPerPackage !== undefined &&
    data.itemsPerPackage < 2
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Package products must have itemsPerPackage >= 2",
      path: ["itemsPerPackage"],
    });
  }

  if (
    data.purchaseMinQuantity !== undefined &&
    data.purchaseMaxQuantity !== undefined &&
    data.purchaseMaxQuantity < data.purchaseMinQuantity
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "purchaseMaxQuantity must be >= purchaseMinQuantity",
      path: ["purchaseMaxQuantity"],
    });
  }
}

export const createProductInputSchema = productFieldsSchema.superRefine(
  refineProductPresentation,
);

export const updateProductInputSchema = productFieldsSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine(refineProductPresentation);

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
  productType: productTypeSchema,
  itemsPerPackage: z.number(),
  packageLabel: z.string().nullable(),
  netPrice: z.number(),
  unitNetPrice: z.number(),
  finalPrice: z.number(),
  finalUnitPrice: z.number(),
  campaign: productCampaignSummarySchema,
  stockSealedPackages: z.number(),
  stockLooseBaseUnits: z.number(),
  stockTotalBaseUnits: z.number(),
  stockDisplay: z.string(),
  purchaseMinQuantity: z.number().int().min(1),
  purchaseMaxQuantity: z.number().int().min(1),
  isActive: z.boolean(),
  imageUrl: z.string().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type ProductListItem = z.infer<typeof productListItemSchema>;

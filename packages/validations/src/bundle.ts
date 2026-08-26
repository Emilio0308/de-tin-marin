import { z } from "zod";
import {
  BUNDLE_CUSTOMIZATION_ABSOLUTE_MAX,
  BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
  BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
} from "./customize-bundle";

export const bundleItemInputSchema = z.object({
  productId: z.string().uuid(),
  unitsPerPerson: z.number().int().min(1).default(1),
});

const bundleCustomizationFieldsSchema = z.object({
  customizationMinProducts: z
    .number()
    .int()
    .min(1)
    .max(BUNDLE_CUSTOMIZATION_ABSOLUTE_MAX)
    .default(BUNDLE_CUSTOMIZATION_DEFAULT_MIN),
  customizationMaxProducts: z
    .number()
    .int()
    .min(1)
    .max(BUNDLE_CUSTOMIZATION_ABSOLUTE_MAX)
    .default(BUNDLE_CUSTOMIZATION_DEFAULT_MAX),
});

function refineCustomizationBounds(
  value: {
    customizationMinProducts: number;
    customizationMaxProducts: number;
    items?: unknown[];
  },
  ctx: z.RefinementCtx,
) {
  if (value.customizationMaxProducts < value.customizationMinProducts) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CUSTOMIZATION_MAX_LT_MIN",
      path: ["customizationMaxProducts"],
    });
  }

  if (value.items) {
    const count = value.items.length;
    if (count < value.customizationMinProducts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ITEMS_BELOW_CUSTOMIZATION_MIN",
        path: ["items"],
      });
    }
    if (count > value.customizationMaxProducts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ITEMS_ABOVE_CUSTOMIZATION_MAX",
        path: ["items"],
      });
    }
  }
}

const createBundleObjectSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional().nullable(),
    imageUrl: z.string().url().optional().nullable().or(z.literal("")),
    containerId: z.string().uuid(),
    quantity: z.number().int().min(1),
    isActive: z.boolean().default(true),
    items: z.array(bundleItemInputSchema).min(1),
  })
  .merge(bundleCustomizationFieldsSchema);

export const createBundleInputSchema = createBundleObjectSchema.superRefine(
  refineCustomizationBounds,
);

export const updateBundleInputSchema = createBundleObjectSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine((value, ctx) => {
    const min =
      value.customizationMinProducts ?? BUNDLE_CUSTOMIZATION_DEFAULT_MIN;
    const max =
      value.customizationMaxProducts ?? BUNDLE_CUSTOMIZATION_DEFAULT_MAX;

    if (
      value.customizationMinProducts !== undefined ||
      value.customizationMaxProducts !== undefined
    ) {
      if (max < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CUSTOMIZATION_MAX_LT_MIN",
          path: ["customizationMaxProducts"],
        });
      }
    }

    if (
      value.items &&
      value.customizationMinProducts !== undefined &&
      value.customizationMaxProducts !== undefined
    ) {
      refineCustomizationBounds(
        {
          customizationMinProducts: value.customizationMinProducts,
          customizationMaxProducts: value.customizationMaxProducts,
          items: value.items,
        },
        ctx,
      );
    }
  });

export const bundleListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  containerId: z.string().uuid(),
  containerName: z.string(),
  containerNetPrice: z.number(),
  quantity: z.number(),
  customizationMinProducts: z.number(),
  customizationMaxProducts: z.number(),
  itemCount: z.number(),
  total: z.number(),
  isActive: z.boolean(),
});

export type BundleItemInput = z.infer<typeof bundleItemInputSchema>;
export type CreateBundleInput = z.infer<typeof createBundleInputSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleInputSchema>;
export type BundleListItem = z.infer<typeof bundleListItemSchema>;

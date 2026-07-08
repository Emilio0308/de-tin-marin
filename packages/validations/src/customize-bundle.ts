import { z } from "zod";
import {
  orderBundleComponentInputSchema,
  orderShoppingCartBundleContainerSchema,
  orderShoppingCartBundleLineSchema,
  orderStockCheckSchema,
} from "./order";

export const BUNDLE_CUSTOMIZATION_MIN = 8;
export const BUNDLE_CUSTOMIZATION_MAX = 20;

export const customizeBundleComponentSchema = orderBundleComponentInputSchema;

export type CustomizeBundleComponent = z.infer<
  typeof customizeBundleComponentSchema
>;

function refineUniqueProductIds(
  components: CustomizeBundleComponent[],
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  for (const [index, component] of components.entries()) {
    if (seen.has(component.productId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DUPLICATE_PRODUCT",
        path: ["components", index, "productId"],
      });
      continue;
    }
    seen.add(component.productId);
  }
}

export const customizeBundleComponentsSchema = z
  .array(customizeBundleComponentSchema)
  .min(BUNDLE_CUSTOMIZATION_MIN)
  .max(BUNDLE_CUSTOMIZATION_MAX)
  .superRefine(refineUniqueProductIds);

export const customizeBundleInputSchema = z
  .object({
    bundleId: z.string().uuid(),
    components: customizeBundleComponentsSchema,
  })
  .superRefine((value, ctx) => {
    refineUniqueProductIds(value.components, ctx);
  });

/** Preview admin: cantidad de sorpresas editable (a diferencia del wizard ecommerce). */
export const previewAdminBundleLineInputSchema = z.object({
  bundleId: z.string().uuid(),
  quantity: z.number().int().min(1),
  components: customizeBundleComponentsSchema,
});

export const getBundleForWizardInputSchema = z.object({
  bundleId: z.string().uuid(),
});

export const bundleWizardTemplateSchema = z.object({
  bundleId: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  personCount: z.number().int().min(1),
  container: orderShoppingCartBundleContainerSchema,
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      unitsPerPerson: z.number().int().min(1),
    }),
  ),
  initialComponents: z.array(customizeBundleComponentSchema),
});

export const bundleLinePreviewSchema = z.object({
  lineTotal: z.number(),
  line: orderShoppingCartBundleLineSchema,
  stockCheck: orderStockCheckSchema,
});

export type CustomizeBundleInput = z.infer<typeof customizeBundleInputSchema>;
export type PreviewAdminBundleLineInput = z.infer<
  typeof previewAdminBundleLineInputSchema
>;
export type BundleWizardTemplate = z.infer<typeof bundleWizardTemplateSchema>;
export type BundleLinePreview = z.infer<typeof bundleLinePreviewSchema>;

export type BundleCustomizationValidationResult =
  | { ok: true; data: CustomizeBundleComponent[] }
  | {
      ok: false;
      error: "MIN_COMPONENTS" | "MAX_COMPONENTS" | "DUPLICATE_PRODUCT";
    };

export function validateBundleCustomization(
  components: unknown,
): BundleCustomizationValidationResult {
  const parsed = customizeBundleComponentsSchema.safeParse(components);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  const issues = parsed.error.issues;
  if (
    issues.some(
      (issue) =>
        issue.code === z.ZodIssueCode.too_small &&
        issue.path.length === 0 &&
        issue.type === "array",
    )
  ) {
    return { ok: false, error: "MIN_COMPONENTS" };
  }

  if (
    issues.some(
      (issue) =>
        issue.code === z.ZodIssueCode.too_big &&
        issue.path.length === 0 &&
        issue.type === "array",
    )
  ) {
    return { ok: false, error: "MAX_COMPONENTS" };
  }

  if (issues.some((issue) => issue.message === "DUPLICATE_PRODUCT")) {
    return { ok: false, error: "DUPLICATE_PRODUCT" };
  }

  return { ok: false, error: "MIN_COMPONENTS" };
}

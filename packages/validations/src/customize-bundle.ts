import { z } from "zod";
import {
  orderBundleComponentInputSchema,
  orderShoppingCartBundleContainerSchema,
  orderShoppingCartBundleLineSchema,
  orderStockCheckSchema,
} from "./order";

/** Defaults for new bundles and legacy rows (migration 00025). */
export const BUNDLE_CUSTOMIZATION_DEFAULT_MIN = 8;
export const BUNDLE_CUSTOMIZATION_DEFAULT_MAX = 20;

/** Absolute ceiling for configurable max (abuse guard). */
export const BUNDLE_CUSTOMIZATION_ABSOLUTE_MAX = 100;

/**
 * Cantidad de sorpresas (line.quantity) en ecommerce / guest.
 * Admin order-form no aplica este rango (solo `>= 1`).
 */
export const BUNDLE_LINE_QUANTITY_MIN = 15;
export const BUNDLE_LINE_QUANTITY_MAX = 100;

/** @deprecated Prefer BUNDLE_CUSTOMIZATION_DEFAULT_MIN — kept for call-site migration. */
export const BUNDLE_CUSTOMIZATION_MIN = BUNDLE_CUSTOMIZATION_DEFAULT_MIN;
/** @deprecated Prefer BUNDLE_CUSTOMIZATION_DEFAULT_MAX — kept for call-site migration. */
export const BUNDLE_CUSTOMIZATION_MAX = BUNDLE_CUSTOMIZATION_DEFAULT_MAX;

export function clampBundleLineQuantity(quantity: number): number {
  const n = Math.floor(quantity);
  if (!Number.isFinite(n)) return BUNDLE_LINE_QUANTITY_MIN;
  return Math.min(
    BUNDLE_LINE_QUANTITY_MAX,
    Math.max(BUNDLE_LINE_QUANTITY_MIN, n),
  );
}

export type BundleCustomizationBounds = {
  minProducts: number;
  maxProducts: number;
};

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

/** Structural shape only — cardinality enforced with per-bundle bounds. */
export const customizeBundleComponentsSchema = z
  .array(customizeBundleComponentSchema)
  .min(1)
  .superRefine(refineUniqueProductIds);

export function createCustomizeBundleComponentsSchema(
  bounds: BundleCustomizationBounds,
) {
  const minProducts = Math.max(1, Math.floor(bounds.minProducts));
  const maxProducts = Math.max(
    minProducts,
    Math.min(BUNDLE_CUSTOMIZATION_ABSOLUTE_MAX, Math.floor(bounds.maxProducts)),
  );

  return z
    .array(customizeBundleComponentSchema)
    .min(minProducts)
    .max(maxProducts)
    .superRefine(refineUniqueProductIds);
}

export function resolveBundleCustomizationBounds(input: {
  customizationMinProducts?: number | null;
  customizationMaxProducts?: number | null;
}): BundleCustomizationBounds {
  const minProducts = Math.max(
    1,
    Math.floor(
      input.customizationMinProducts ?? BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
    ),
  );
  const rawMax = Math.floor(
    input.customizationMaxProducts ?? BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
  );
  const maxProducts = Math.max(
    minProducts,
    Math.min(BUNDLE_CUSTOMIZATION_ABSOLUTE_MAX, rawMax),
  );

  return { minProducts, maxProducts };
}

export const customizeBundleInputSchema = z
  .object({
    bundleId: z.string().uuid(),
    quantity: z
      .number()
      .int()
      .min(BUNDLE_LINE_QUANTITY_MIN)
      .max(BUNDLE_LINE_QUANTITY_MAX),
    components: customizeBundleComponentsSchema,
  })
  .superRefine((value, ctx) => {
    refineUniqueProductIds(value.components, ctx);
  });

/** Preview admin: cantidad editable sin tope ecommerce (solo `>= 1`). */
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
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  personCount: z.number().int().min(1),
  customizationMinProducts: z.number().int().min(1),
  customizationMaxProducts: z.number().int().min(1),
  container: orderShoppingCartBundleContainerSchema,
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      imageUrl: z.string(),
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
  bounds: BundleCustomizationBounds = {
    minProducts: BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
    maxProducts: BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
  },
): BundleCustomizationValidationResult {
  const parsed =
    createCustomizeBundleComponentsSchema(bounds).safeParse(components);
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

export function validateOrderLinesBundleCustomization(
  lines: Array<{
    type: string;
    bundleId?: string;
    components?: unknown;
  }>,
  boundsByBundleId: Map<string, BundleCustomizationBounds>,
): boolean {
  for (const line of lines) {
    if (line.type !== "bundle" || !line.bundleId) continue;
    const bounds = boundsByBundleId.get(line.bundleId);
    if (!bounds) return false;
    if (!validateBundleCustomization(line.components, bounds).ok) {
      return false;
    }
  }
  return true;
}

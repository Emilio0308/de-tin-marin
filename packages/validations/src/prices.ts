import { z } from "zod";

const MONEY_TOLERANCE = 0.01;

export const priceNormalSchema = z
  .object({
    netPrice: z.number().nonnegative(),
    igv: z.number().nonnegative(),
    subtotal: z.number().nonnegative(),
  })
  .refine(
    (data) =>
      Math.abs(data.subtotal + data.igv - data.netPrice) <= MONEY_TOLERANCE,
    { message: "subtotal + igv must equal netPrice" },
  );

export const pricesSchema = z.object({
  normal: priceNormalSchema,
  unit: priceNormalSchema,
  suggested: z.record(z.unknown()).optional().default({}),
  fantasy: z.record(z.unknown()).optional().default({}),
});

export function pricesSchemaWithCoherence(itemsPerPackage: number) {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  return pricesSchema.refine(
    (data) =>
      Math.abs(data.unit.netPrice * safeItems - data.normal.netPrice) <=
      MONEY_TOLERANCE,
    { message: "unit.netPrice × items_per_package must equal normal.netPrice" },
  );
}

export type PriceNormal = z.infer<typeof priceNormalSchema>;
export type Prices = z.infer<typeof pricesSchema>;

export const netPriceInputSchema = z.number().nonnegative();

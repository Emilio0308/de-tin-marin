import { z } from "zod";

export const catalogStatusSectionSchema = z.enum([
  "products",
  "bundles",
  "packs",
  "containers",
  "orders",
]);

export const exportCatalogStatusInputSchema = z.object({
  sections: z.array(catalogStatusSectionSchema).min(1),
});

export type CatalogStatusSection = z.infer<typeof catalogStatusSectionSchema>;
export type ExportCatalogStatusInput = z.infer<
  typeof exportCatalogStatusInputSchema
>;

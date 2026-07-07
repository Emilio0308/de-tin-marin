import { z } from "zod";

export const publicCatalogSortSchema = z.enum([
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
]);

export type PublicCatalogSort = z.infer<typeof publicCatalogSortSchema>;

export const publicProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(12),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
  sort: publicCatalogSortSchema.optional().default("name_asc"),
});

export const publicBundleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(12),
  search: z.string().trim().min(1).optional(),
  sort: publicCatalogSortSchema.optional().default("name_asc"),
});

export type PublicProductListQuery = z.infer<
  typeof publicProductListQuerySchema
>;
export type PublicBundleListQuery = z.infer<typeof publicBundleListQuerySchema>;

export const publicProductListItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  imageUrl: z.string().nullable(),
  finalPrice: z.number(),
  stockTotalBaseUnits: z.number(),
  stockDisplay: z.string(),
  itemsPerPackage: z.number(),
});

export const publicBundleListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  quantity: z.number(),
  containerName: z.string(),
  total: z.number(),
  itemCount: z.number(),
  itemsPreview: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
});

export const publicCategoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const publicProductDetailSchema = publicProductListItemSchema.extend({
  description: z.string().nullable(),
  productType: z.enum(["unit", "package"]),
  packageLabel: z.string().nullable(),
});

export const publicBundleDetailSchema = publicBundleListItemSchema.extend({
  description: z.string().nullable(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      unitsPerPerson: z.number(),
    }),
  ),
});

export const publicPaginatedProductsSchema = z.object({
  items: z.array(publicProductListItemSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const publicPaginatedBundlesSchema = z.object({
  items: z.array(publicBundleListItemSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const getPublicProductInputSchema = z.union([
  z.object({ slug: z.string().min(1) }),
  z.object({ id: z.string().uuid() }),
]);

export const getPublicBundleInputSchema = z.object({
  id: z.string().uuid(),
});

export type PublicProductListItem = z.infer<typeof publicProductListItemSchema>;
export type PublicBundleListItem = z.infer<typeof publicBundleListItemSchema>;
export type PublicCategoryItem = z.infer<typeof publicCategoryItemSchema>;
export type PublicProductDetail = z.infer<typeof publicProductDetailSchema>;
export type PublicBundleDetail = z.infer<typeof publicBundleDetailSchema>;

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; page: number; pageSize: number; total: number } {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
  };
}

type SortableByName = { name: string };
type SortableByPrice = SortableByName & { finalPrice: number };
type SortableBundle = SortableByName & { total: number };

export function sortPublicProducts(
  items: SortableByPrice[],
  sort: PublicCatalogSort,
): SortableByPrice[] {
  const sorted = [...items];
  switch (sort) {
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "name_desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "es"));
    case "price_asc":
      return sorted.sort((a, b) => a.finalPrice - b.finalPrice);
    case "price_desc":
      return sorted.sort((a, b) => b.finalPrice - a.finalPrice);
    default:
      return sorted;
  }
}

export function sortPublicBundles(
  items: SortableBundle[],
  sort: PublicCatalogSort,
): SortableBundle[] {
  const sorted = [...items];
  switch (sort) {
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "name_desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "es"));
    case "price_asc":
      return sorted.sort((a, b) => a.total - b.total);
    case "price_desc":
      return sorted.sort((a, b) => b.total - a.total);
    default:
      return sorted;
  }
}

export function parsePublicProductListQuery(
  raw: unknown,
):
  | { ok: true; data: PublicProductListQuery }
  | { ok: false; error: "VALIDATION" } {
  const parsed = publicProductListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };
  return { ok: true, data: parsed.data };
}

export function parsePublicBundleListQuery(
  raw: unknown,
):
  | { ok: true; data: PublicBundleListQuery }
  | { ok: false; error: "VALIDATION" } {
  const parsed = publicBundleListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };
  return { ok: true, data: parsed.data };
}

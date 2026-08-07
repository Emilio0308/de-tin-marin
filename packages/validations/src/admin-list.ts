import { z } from "zod";

export const ADMIN_DEFAULT_PAGE_SIZE = 5;
export const ADMIN_MAX_PAGE_SIZE = 50;

export const adminListPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_MAX_PAGE_SIZE)
    .optional()
    .default(ADMIN_DEFAULT_PAGE_SIZE),
});

export const adminStatusFilterSchema = z
  .enum(["all", "active", "inactive"])
  .optional()
  .default("all");

export const adminProductListQuerySchema = adminListPaginationSchema.extend({
  search: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  status: adminStatusFilterSchema,
});

export const adminPackListQuerySchema = adminListPaginationSchema.extend({
  search: z.string().trim().optional(),
  status: adminStatusFilterSchema,
});

export const adminBundleListQuerySchema = adminListPaginationSchema.extend({
  search: z.string().trim().optional(),
  status: adminStatusFilterSchema,
});

export const adminContainerStatusFilterSchema = z
  .enum(["all", "active", "inactive", "outOfStock"])
  .optional()
  .default("all");

export const adminContainerListQuerySchema = adminListPaginationSchema.extend({
  search: z.string().trim().optional(),
  status: adminContainerStatusFilterSchema,
});

export const adminCategoryListQuerySchema = adminListPaginationSchema.extend({
  search: z.string().trim().optional(),
  status: adminStatusFilterSchema,
});

export const adminOrderListQuerySchema = adminListPaginationSchema;

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
export type AdminPackListQuery = z.infer<typeof adminPackListQuerySchema>;
export type AdminBundleListQuery = z.infer<typeof adminBundleListQuerySchema>;
export type AdminContainerListQuery = z.infer<
  typeof adminContainerListQuerySchema
>;
export type AdminCategoryListQuery = z.infer<
  typeof adminCategoryListQuerySchema
>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

export type AdminListPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export function adminListRange(
  page: number,
  pageSize: number,
): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function adminListPageBounds(
  page: number,
  pageSize: number,
  total: number,
  itemCount: number,
): { from: number; to: number } {
  if (total === 0 || itemCount === 0) {
    return { from: 0, to: 0 };
  }
  const from = (page - 1) * pageSize + 1;
  const to = from + itemCount - 1;
  return { from, to };
}

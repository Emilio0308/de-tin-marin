import {
  ADMIN_DEFAULT_PAGE_SIZE,
  adminBundleListQuerySchema,
  adminCategoryListQuerySchema,
  adminContainerListQuerySchema,
  adminOrderListQuerySchema,
  adminPackListQuerySchema,
  adminProductListQuerySchema,
  type AdminBundleListQuery,
  type AdminCategoryListQuery,
  type AdminContainerListQuery,
  type AdminOrderListQuery,
  type AdminPackListQuery,
  type AdminProductListQuery,
} from "@de-tin-marin/validations/admin-list";

function readParam(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key);
  return value === null || value === "" ? undefined : value;
}

export function readAdminProductListQuery(
  searchParams: URLSearchParams,
): AdminProductListQuery {
  const parsed = adminProductListQuerySchema.safeParse({
    page: readParam(searchParams, "page"),
    pageSize: readParam(searchParams, "pageSize") ?? ADMIN_DEFAULT_PAGE_SIZE,
    search: readParam(searchParams, "search"),
    categoryId: readParam(searchParams, "categoryId"),
    status: readParam(searchParams, "status"),
  });
  if (parsed.success) return parsed.data;
  return adminProductListQuerySchema.parse({});
}

export function readAdminPackListQuery(
  searchParams: URLSearchParams,
): AdminPackListQuery {
  const parsed = adminPackListQuerySchema.safeParse({
    page: readParam(searchParams, "page"),
    pageSize: readParam(searchParams, "pageSize") ?? ADMIN_DEFAULT_PAGE_SIZE,
    search: readParam(searchParams, "search"),
    status: readParam(searchParams, "status"),
  });
  if (parsed.success) return parsed.data;
  return adminPackListQuerySchema.parse({});
}

export function readAdminBundleListQuery(
  searchParams: URLSearchParams,
): AdminBundleListQuery {
  const parsed = adminBundleListQuerySchema.safeParse({
    page: readParam(searchParams, "page"),
    pageSize: readParam(searchParams, "pageSize") ?? ADMIN_DEFAULT_PAGE_SIZE,
    search: readParam(searchParams, "search"),
    status: readParam(searchParams, "status"),
  });
  if (parsed.success) return parsed.data;
  return adminBundleListQuerySchema.parse({});
}

export function readAdminContainerListQuery(
  searchParams: URLSearchParams,
): AdminContainerListQuery {
  const parsed = adminContainerListQuerySchema.safeParse({
    page: readParam(searchParams, "page"),
    pageSize: readParam(searchParams, "pageSize") ?? ADMIN_DEFAULT_PAGE_SIZE,
    search: readParam(searchParams, "search"),
    status: readParam(searchParams, "status"),
  });
  if (parsed.success) return parsed.data;
  return adminContainerListQuerySchema.parse({});
}

export function readAdminCategoryListQuery(
  searchParams: URLSearchParams,
): AdminCategoryListQuery {
  const parsed = adminCategoryListQuerySchema.safeParse({
    page: readParam(searchParams, "page"),
    pageSize: readParam(searchParams, "pageSize") ?? ADMIN_DEFAULT_PAGE_SIZE,
    search: readParam(searchParams, "search"),
    status: readParam(searchParams, "status"),
  });
  if (parsed.success) return parsed.data;
  return adminCategoryListQuerySchema.parse({});
}

export function readAdminOrderListQuery(
  searchParams: URLSearchParams,
): AdminOrderListQuery {
  const parsed = adminOrderListQuerySchema.safeParse({
    page: readParam(searchParams, "page"),
    pageSize: readParam(searchParams, "pageSize") ?? ADMIN_DEFAULT_PAGE_SIZE,
  });
  if (parsed.success) return parsed.data;
  return adminOrderListQuerySchema.parse({});
}

export function buildAdminListSearchParams(
  current: URLSearchParams,
  updates: Record<string, string | undefined>,
): URLSearchParams {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  return params;
}

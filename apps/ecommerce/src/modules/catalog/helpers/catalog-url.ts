import {
  publicBundleListQuerySchema,
  publicProductListQuerySchema,
  type PublicBundleListQuery,
  type PublicCatalogSort,
  type PublicProductListQuery,
} from "@de-tin-marin/validations/public-catalog";
import { DEFAULT_PAGE_SIZE } from "../constants";

export function readProductListQuery(
  searchParams: URLSearchParams,
): PublicProductListQuery {
  const parsed = publicProductListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE,
    categoryId: searchParams.get("categoryId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  if (parsed.success) return parsed.data;

  return publicProductListQuerySchema.parse({});
}

export function readBundleListQuery(
  searchParams: URLSearchParams,
): PublicBundleListQuery {
  const parsed = publicBundleListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE,
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  if (parsed.success) return parsed.data;

  return publicBundleListQuerySchema.parse({});
}

export function buildCatalogSearchParams(
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

export function catalogSortOptions(labels: {
  nameAsc: string;
  nameDesc: string;
  priceAsc: string;
  priceDesc: string;
}): Array<{ value: PublicCatalogSort; label: string }> {
  return [
    { value: "name_asc", label: labels.nameAsc },
    { value: "name_desc", label: labels.nameDesc },
    { value: "price_asc", label: labels.priceAsc },
    { value: "price_desc", label: labels.priceDesc },
  ];
}

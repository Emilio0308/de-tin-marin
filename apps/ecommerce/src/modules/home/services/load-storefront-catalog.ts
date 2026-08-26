import "server-only";

import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { PublicHeroConfig } from "@de-tin-marin/validations/hero";
import type {
  PublicBundleListItem,
  PublicBundleListQuery,
  PublicCategoryItem,
  PublicPackListItem,
  PublicPackListQuery,
  PublicProductListItem,
  PublicProductListQuery,
} from "@de-tin-marin/validations/public-catalog";
import {
  readBundleListQuery,
  readPackListQuery,
  readProductListQuery,
} from "@/modules/catalog/helpers/catalog-url";
import { getCatalogVersionService } from "@/modules/catalog/services/catalog-version.service";
import {
  listPublicBundlesService,
  listPublicCategoriesService,
  listPublicPacksService,
  listPublicProductsService,
} from "@/modules/catalog/services/public-catalog.service";
import {
  readStorefrontTab,
  type StorefrontTab,
} from "@/modules/home/helpers/storefront-url";
import { getPublicHeroConfigService } from "@/modules/home/services/public-hero.service";

export type CatalogListPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type StorefrontCatalogPayload = {
  tab: StorefrontTab;
  versionAt: string;
  hero: PublicHeroConfig;
  productQuery: PublicProductListQuery;
  bundleQuery: PublicBundleListQuery;
  packQuery: PublicPackListQuery;
  categories: PublicCategoryItem[] | null;
  products: CatalogListPage<PublicProductListItem> | null;
  bundles: CatalogListPage<PublicBundleListItem> | null;
  packs: CatalogListPage<PublicPackListItem> | null;
};

const EMPTY_HERO: PublicHeroConfig = {
  displayMode: "static",
  slides: [],
};

export function searchParamsRecordToURLSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else {
      params.set(key, value);
    }
  }
  return params;
}

function emptyListPage<T>(page: number, pageSize: number): CatalogListPage<T> {
  return { items: [], page, pageSize, total: 0 };
}

export async function loadStorefrontCatalog(
  config: SupabaseConfig,
  searchParams: URLSearchParams,
): Promise<StorefrontCatalogPayload> {
  const tab = readStorefrontTab(searchParams);
  const productQuery = readProductListQuery(searchParams);
  const bundleQuery = readBundleListQuery(searchParams);
  const packQuery = readPackListQuery(searchParams);

  const versionPromise = getCatalogVersionService(config);
  const heroPromise = getPublicHeroConfigService(config);

  if (tab === "sorpresas") {
    const [version, hero, bundlesResult] = await Promise.all([
      versionPromise,
      heroPromise,
      listPublicBundlesService(config, bundleQuery),
    ]);

    return {
      tab,
      versionAt: version.data.versionAt,
      hero: hero.ok ? hero.data : EMPTY_HERO,
      productQuery,
      bundleQuery,
      packQuery,
      categories: null,
      products: null,
      bundles: bundlesResult.ok
        ? bundlesResult.data
        : emptyListPage(bundleQuery.page, bundleQuery.pageSize),
      packs: null,
    };
  }

  if (tab === "combos") {
    const [version, hero, packsResult] = await Promise.all([
      versionPromise,
      heroPromise,
      listPublicPacksService(config, packQuery),
    ]);

    return {
      tab,
      versionAt: version.data.versionAt,
      hero: hero.ok ? hero.data : EMPTY_HERO,
      productQuery,
      bundleQuery,
      packQuery,
      categories: null,
      products: null,
      bundles: null,
      packs: packsResult.ok
        ? packsResult.data
        : emptyListPage(packQuery.page, packQuery.pageSize),
    };
  }

  const [version, hero, categoriesResult, productsResult] = await Promise.all([
    versionPromise,
    heroPromise,
    listPublicCategoriesService(config),
    listPublicProductsService(config, productQuery),
  ]);

  return {
    tab: "productos",
    versionAt: version.data.versionAt,
    hero: hero.ok ? hero.data : EMPTY_HERO,
    productQuery,
    bundleQuery,
    packQuery,
    categories: categoriesResult.data,
    products: productsResult.ok
      ? productsResult.data
      : emptyListPage(productQuery.page, productQuery.pageSize),
    bundles: null,
    packs: null,
  };
}

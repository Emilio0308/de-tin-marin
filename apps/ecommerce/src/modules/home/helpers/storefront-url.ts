export type StorefrontTab = "productos" | "sorpresas" | "combos";

export const STOREFRONT_TAB_PARAM = "tab";

export function readStorefrontTab(
  searchParams: URLSearchParams,
): StorefrontTab {
  const tab = searchParams.get(STOREFRONT_TAB_PARAM);
  if (tab === "sorpresas") return "sorpresas";
  if (tab === "combos") return "combos";
  return "productos";
}

export function storefrontTabHref(tab: StorefrontTab): string {
  return `/?${STOREFRONT_TAB_PARAM}=${tab}`;
}

export function buildStorefrontSearchParams(
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

  if (!params.get(STOREFRONT_TAB_PARAM)) {
    params.set(STOREFRONT_TAB_PARAM, "productos");
  }

  return params;
}

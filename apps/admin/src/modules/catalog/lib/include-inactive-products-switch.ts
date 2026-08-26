/**
 * Switch UI to list inactive products in pack/bundle composition pickers.
 *
 * Keep `false` for now: create/update still require **active** products via
 * `getActiveProductsByIdsRepo` in `pack.service` / `bundle.service`
 * (`validatePackItems` / `validateBundleItems`, Regla 6).
 *
 * To enable later:
 * 1. Set this flag to `true`.
 * 2. Relax those validators (and Regla 6) so inactive products can be persisted;
 *    otherwise the picker will show inactive products but save will fail with
 *    `PRODUCT_NOT_FOUND`.
 */
export const SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH = false;

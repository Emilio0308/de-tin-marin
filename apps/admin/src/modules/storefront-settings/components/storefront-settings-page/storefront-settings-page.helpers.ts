import type { StorefrontSettingsDraft } from "./storefront-settings-page.types";

export const EMPTY_STOREFRONT_SETTINGS_DRAFT: StorefrontSettingsDraft = {
  freeDelivery: false,
  freePickupPoint: false,
  freeFulfillmentStartsAt: null,
  freeFulfillmentEndsAt: null,
  minOrderSubtotal: 0,
  announcementEnabled: false,
  announcementMessage: null,
};

/** `datetime-local` value from ISO timestamptz (local timezone). */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO string from `datetime-local` input; empty → null. */
export function fromDatetimeLocalValue(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

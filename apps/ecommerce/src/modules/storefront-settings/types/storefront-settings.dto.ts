export type StorefrontSettingsDTO = {
  freeDelivery: boolean;
  freePickupPoint: boolean;
  freeFulfillmentStartsAt: string | null;
  freeFulfillmentEndsAt: string | null;
  minOrderSubtotal: number;
  announcementEnabled: boolean;
  announcementMessage: string | null;
};

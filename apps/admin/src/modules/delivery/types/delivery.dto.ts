export type DeliveryZoneDTO = {
  id: string;
  district: string;
  fee: number;
  isActive: boolean;
  sortOrder: number;
};

export type DeliverySettingsDTO = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  fallbackFee: number;
};

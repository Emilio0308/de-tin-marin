export type DeliveryZoneDTO = {
  id: string;
  district: string;
  fee: number;
  isActive: boolean;
  sortOrder: number;
};

export type DeliverySettingsDTO = {
  pickupEnabled: boolean;
  pickupPointsEnabled: boolean;
  deliveryEnabled: boolean;
  fallbackFee: number;
};

export type PickupPointDTO = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fee: number;
  isActive: boolean;
  sortOrder: number;
};

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
  courierEnabled: boolean;
  fallbackFee: number;
};

export type CourierProvinceDTO = {
  slug: string;
  name: string;
  enabled: boolean;
};

export type CourierDepartmentDTO = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  provinces: CourierProvinceDTO[];
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

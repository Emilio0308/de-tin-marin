import type { MapPin } from "@de-tin-marin/validations/checkout";

export type DeliveryMapProps = {
  mapPin: MapPin;
  onChange?: (pin: MapPin) => void;
  readOnly?: boolean;
  labels: {
    title: string;
    hint: string;
  };
};

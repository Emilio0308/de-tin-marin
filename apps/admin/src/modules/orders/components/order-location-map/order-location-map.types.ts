import type { MapPin } from "@de-tin-marin/validations/checkout";

export type OrderLocationMapLabels = {
  title: string;
  hint: string;
  unavailable: string;
};

export type OrderLocationMapProps = {
  mapPin: MapPin | null;
  fulfillmentMethod: "delivery" | "pickup";
  labels: OrderLocationMapLabels;
};

"use client";

import dynamic from "next/dynamic";
import type { DeliveryMapProps } from "./delivery-map.types";

const DeliveryMapClient = dynamic(
  () => import("./delivery-map").then((mod) => mod.DeliveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="border-outline-variant bg-surface-container h-72 rounded-2xl border" />
    ),
  },
);

export function DeliveryMap(props: DeliveryMapProps) {
  return <DeliveryMapClient {...props} />;
}

export { defaultMapPin } from "./delivery-map.constants";

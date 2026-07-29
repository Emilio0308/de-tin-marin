"use client";

import dynamic from "next/dynamic";
import type { OrderLocationMapProps } from "./order-location-map.types";

export const OrderLocationMap = dynamic<OrderLocationMapProps>(
  () =>
    import("./order-location-map").then((module) => module.OrderLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="border-outline-variant/30 bg-surface-container-low h-72 animate-pulse rounded-2xl border" />
    ),
  },
);

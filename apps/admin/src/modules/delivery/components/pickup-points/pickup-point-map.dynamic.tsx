"use client";

import dynamic from "next/dynamic";

export const PickupPointMap = dynamic(
  () =>
    import("./pickup-point-map").then((module) => ({
      default: module.PickupPointMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="border-outline-variant/30 bg-surface-container-low h-72 animate-pulse rounded-2xl border" />
    ),
  },
);

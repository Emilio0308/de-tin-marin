"use client";

import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@de-tin-marin/shared/cn";
import { DeliverySettingsContainer } from "@/modules/delivery/components/delivery-settings/delivery-settings.container";
import { PickupPointsContainer } from "@/modules/delivery/components/pickup-points/pickup-points.container";

type DeliveryTab = "delivery" | "pickupPoints";

function tabClass(selected: boolean): string {
  return cn(
    "font-label text-label-bold inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/5 text-primary"
      : "border-outline-variant/40 text-on-surface-variant hover:border-secondary/60",
  );
}

export function DeliveryPageContainer() {
  const t = useTranslations("delivery");
  const [activeTab, setActiveTab] = useState<DeliveryTab>("delivery");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="px-margin-mobile pt-stack-md sm:px-stack-md lg:px-8 lg:pt-8">
        <div
          role="tablist"
          aria-label={t("tabListLabel")}
          className="bg-surface-container-low inline-flex w-full flex-wrap gap-2 rounded-2xl p-2 sm:w-fit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "delivery"}
            className={tabClass(activeTab === "delivery")}
            onClick={() => setActiveTab("delivery")}
          >
            <Truck className="h-4 w-4" aria-hidden />
            {t("tabDelivery")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pickupPoints"}
            className={tabClass(activeTab === "pickupPoints")}
            onClick={() => setActiveTab("pickupPoints")}
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {t("tabPickupPoints")}
          </button>
        </div>
      </div>

      {activeTab === "delivery" ? (
        <DeliverySettingsContainer />
      ) : (
        <PickupPointsContainer />
      )}
    </div>
  );
}

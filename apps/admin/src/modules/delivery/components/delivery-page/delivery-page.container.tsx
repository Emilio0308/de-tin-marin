"use client";

import { useState } from "react";
import { MapPin, Package, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@de-tin-marin/shared/cn";
import { CourierDestinationsContainer } from "@/modules/delivery/components/courier-destinations/courier-destinations.container";
import { DeliveryGlobalSettingsContainer } from "@/modules/delivery/components/delivery-settings/delivery-global-settings.container";
import { DeliverySettingsContainer } from "@/modules/delivery/components/delivery-settings/delivery-settings.container";
import { PickupPointsContainer } from "@/modules/delivery/components/pickup-points/pickup-points.container";

type DeliveryTab = "delivery" | "pickupPoints" | "courier";

function tabClass(selected: boolean): string {
  return cn(
    "font-label text-label-bold inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/5 text-primary"
      : "border-outline-variant/40 text-on-surface-variant hover:border-secondary/60",
  );
}

function tabPanelClass(active: boolean): string {
  return cn("flex flex-col", !active && "hidden");
}

export function DeliveryPageContainer() {
  const t = useTranslations("delivery");
  const [activeTab, setActiveTab] = useState<DeliveryTab>("delivery");
  const [mountedTabs, setMountedTabs] = useState<Set<DeliveryTab>>(
    () => new Set(["delivery"]),
  );

  function selectTab(tab: DeliveryTab) {
    setActiveTab(tab);
    setMountedTabs((current) => {
      if (current.has(tab)) return current;
      return new Set(current).add(tab);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="px-margin-mobile pt-stack-md sm:px-stack-md mx-auto flex w-full max-w-5xl flex-col gap-6 lg:px-8 lg:pt-8">
        <header className="space-y-2">
          <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
            {t("title")}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        <DeliveryGlobalSettingsContainer />

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
            onClick={() => selectTab("delivery")}
          >
            <Truck className="h-4 w-4" aria-hidden />
            {t("tabDelivery")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pickupPoints"}
            className={tabClass(activeTab === "pickupPoints")}
            onClick={() => selectTab("pickupPoints")}
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {t("tabPickupPoints")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "courier"}
            className={tabClass(activeTab === "courier")}
            onClick={() => selectTab("courier")}
          >
            <Package className="h-4 w-4" aria-hidden />
            {t("tabCourier")}
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        aria-hidden={activeTab !== "delivery"}
        className={tabPanelClass(activeTab === "delivery")}
      >
        <DeliverySettingsContainer />
      </div>

      {mountedTabs.has("pickupPoints") ? (
        <div
          role="tabpanel"
          aria-hidden={activeTab !== "pickupPoints"}
          className={tabPanelClass(activeTab === "pickupPoints")}
        >
          <PickupPointsContainer isActive={activeTab === "pickupPoints"} />
        </div>
      ) : null}

      {mountedTabs.has("courier") ? (
        <div
          role="tabpanel"
          aria-hidden={activeTab !== "courier"}
          className={tabPanelClass(activeTab === "courier")}
        >
          <CourierDestinationsContainer />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getDeliverySettingsAction,
  updateDeliverySettingsAction,
} from "@/modules/delivery/actions/delivery.actions";
import { DeliveryGlobalSettings } from "./delivery-global-settings";
import type {
  DeliveryGlobalSettingsLabels,
  DeliverySettingsValues,
} from "./delivery-settings.types";

function settingsErrorMessage(
  error: string,
  t: ReturnType<typeof useTranslations<"delivery.errors">>,
): string {
  if (error === "VALIDATION") return t("validation");
  return t("default");
}

export function DeliveryGlobalSettingsContainer() {
  const t = useTranslations("delivery");
  const tErrors = useTranslations("delivery.errors");
  const queryClient = useQueryClient();

  const [settingsDraft, setSettingsDraft] =
    useState<DeliverySettingsValues | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const result = await getDeliverySettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSettingsDraft((current) => current ?? settingsQuery.data);
  }, [settingsQuery.data]);

  const settings = settingsDraft ?? settingsQuery.data;

  const saveSettingsMutation = useMutation({
    mutationFn: async (values: DeliverySettingsValues) => {
      const result = await updateDeliverySettingsAction(values);
      if (!result.ok) throw new Error(result.error);
      return values;
    },
    onSuccess: (savedValues) => {
      setSettingsError(null);
      queryClient.setQueryData(["delivery-settings"], savedValues);
      setSettingsDraft(null);
      toast.success(t("settingsSaved"));
    },
    onError: (error: Error) => {
      setSettingsError(settingsErrorMessage(error.message, tErrors));
    },
  });

  const labels = useMemo<DeliveryGlobalSettingsLabels>(
    () => ({
      sectionGlobal: t("sectionGlobal"),
      pickupEnabled: t("pickupEnabled"),
      pickupHint: t("pickupHint"),
      pickupPointsEnabled: t("pickupPointsEnabled"),
      pickupPointsHint: t("pickupPointsHint"),
      deliveryEnabled: t("deliveryEnabled"),
      deliveryHint: t("deliveryHint"),
      courierEnabled: t("courierEnabled"),
      courierHint: t("courierHint"),
      fallbackFee: t("fallbackFee"),
      fallbackHint: t("fallbackHint"),
      saveSettings: t("saveSettings"),
      savingSettings: t("savingSettings"),
      loading: t("loading"),
      loadError: t("loadError"),
    }),
    [t],
  );

  if (settingsQuery.isLoading || !settingsQuery.data || !settings) {
    return (
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
        <p className="font-body text-body-md text-on-surface-variant">
          {labels.loading}
        </p>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="border-error/20 bg-error-container/40 rounded-4xl border p-12 text-center">
        <p className="font-body text-body-md text-on-error-container">
          {labels.loadError}
        </p>
      </div>
    );
  }

  return (
    <DeliveryGlobalSettings
      settings={settings}
      labels={labels}
      settingsSubmitting={saveSettingsMutation.isPending}
      settingsError={settingsError}
      onSettingsChange={setSettingsDraft}
      onSaveSettings={() => saveSettingsMutation.mutate(settings)}
    />
  );
}

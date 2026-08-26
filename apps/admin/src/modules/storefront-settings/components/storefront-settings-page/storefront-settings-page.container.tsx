"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  getStorefrontSettingsAction,
  updateStorefrontSettingsAction,
} from "@/modules/storefront-settings/actions/storefront-settings.actions";
import { StorefrontSettingsPage } from "./storefront-settings-page";
import { EMPTY_STOREFRONT_SETTINGS_DRAFT } from "./storefront-settings-page.helpers";
import type {
  StorefrontSettingsDraft,
  StorefrontSettingsLabels,
} from "./storefront-settings-page.types";

const QUERY_KEY = ["storefront-settings"] as const;

export function StorefrontSettingsPageContainer() {
  const t = useTranslations("storefrontSettings");
  const tErrors = useTranslations("storefrontSettings.errors");
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<StorefrontSettingsDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getStorefrontSettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setDraft((current) => current ?? settingsQuery.data);
  }, [settingsQuery.data]);

  const values = draft ?? settingsQuery.data ?? EMPTY_STOREFRONT_SETTINGS_DRAFT;

  const labels: StorefrontSettingsLabels = useMemo(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
      sectionPromo: t("sectionPromo"),
      sectionMinOrder: t("sectionMinOrder"),
      sectionAnnouncement: t("sectionAnnouncement"),
      freeDelivery: t("freeDelivery"),
      freeDeliveryHint: t("freeDeliveryHint"),
      freePickupPoint: t("freePickupPoint"),
      freePickupPointHint: t("freePickupPointHint"),
      freeWindowStart: t("freeWindowStart"),
      freeWindowEnd: t("freeWindowEnd"),
      freeWindowHint: t("freeWindowHint"),
      minOrderSubtotal: t("minOrderSubtotal"),
      minOrderHint: t("minOrderHint"),
      announcementEnabled: t("announcementEnabled"),
      announcementEnabledHint: t("announcementEnabledHint"),
      announcementMessage: t("announcementMessage"),
      announcementMessageHint: t("announcementMessageHint"),
      save: t("save"),
      saving: t("saving"),
      saved: t("saved"),
      infoTip: t("infoTip"),
    }),
    [t],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: StorefrontSettingsDraft) => {
      const result = await updateStorefrontSettingsAction(payload);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (saved) => {
      setError(null);
      setMessage(labels.saved);
      queryClient.setQueryData(QUERY_KEY, saved);
      setDraft(null);
    },
    onError: (err: Error) => {
      setMessage(null);
      setError(
        err.message === "VALIDATION"
          ? tErrors("validation")
          : tErrors("default"),
      );
    },
  });

  const isInitialLoading =
    settingsQuery.isLoading && settingsQuery.data === undefined;

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md lg:p-8">
      <StorefrontSettingsPage
        labels={labels}
        values={values}
        loading={isInitialLoading}
        loadError={settingsQuery.isError ? labels.loadError : null}
        submitting={saveMutation.isPending}
        message={message}
        error={error}
        onChange={(patch) => {
          setMessage(null);
          setError(null);
          setDraft({ ...values, ...patch });
        }}
        onSave={() => saveMutation.mutate(values)}
      />
    </div>
  );
}

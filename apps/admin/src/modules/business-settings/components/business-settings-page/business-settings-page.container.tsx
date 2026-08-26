"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  getBusinessSettingsAction,
  updateBusinessSettingsAction,
} from "@/modules/business-settings/actions/business-settings.actions";
import { BusinessSettingsPage } from "./business-settings-page";
import { EMPTY_BUSINESS_SETTINGS_DRAFT } from "./business-settings-page.helpers";
import type {
  BusinessSettingsDraft,
  BusinessSettingsLabels,
} from "./business-settings-page.types";

export function BusinessSettingsPageContainer() {
  const t = useTranslations("businessSettings");
  const tErrors = useTranslations("businessSettings.errors");
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<BusinessSettingsDraft>(
    EMPTY_BUSINESS_SETTINGS_DRAFT,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const result = await getBusinessSettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setDraft(settingsQuery.data);
  }, [settingsQuery.data]);

  const labels: BusinessSettingsLabels = useMemo(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
      sectionContact: t("sectionContact"),
      sectionPayments: t("sectionPayments"),
      whatsappE164: t("whatsappE164"),
      whatsappHint: t("whatsappHint"),
      email: t("email"),
      emailHint: t("emailHint"),
      yapePhone: t("yapePhone"),
      yapePhoneHint: t("yapePhoneHint"),
      yapeHolderName: t("yapeHolderName"),
      bankName: t("bankName"),
      bankAccountHolderName: t("bankAccountHolderName"),
      bankAccountNumber: t("bankAccountNumber"),
      bankAccountNumberHint: t("bankAccountNumberHint"),
      bankInterbankAccountNumber: t("bankInterbankAccountNumber"),
      bankInterbankAccountNumberHint: t("bankInterbankAccountNumberHint"),
      save: t("save"),
      saving: t("saving"),
      saved: t("saved"),
      infoTip: t("infoTip"),
    }),
    [t],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: BusinessSettingsDraft) => {
      const result = await updateBusinessSettingsAction(payload);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setError(null);
      setMessage(labels.saved);
      await queryClient.invalidateQueries({ queryKey: ["business-settings"] });
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

  return (
    <BusinessSettingsPage
      labels={labels}
      values={draft}
      loading={settingsQuery.isLoading}
      loadError={settingsQuery.isError ? labels.loadError : null}
      submitting={saveMutation.isPending}
      message={message}
      error={error}
      onChange={(patch) => {
        setMessage(null);
        setError(null);
        setDraft((current) => ({ ...current, ...patch }));
      }}
      onSave={() => saveMutation.mutate(draft)}
    />
  );
}

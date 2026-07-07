"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  deleteDeliveryZoneAction,
  getDeliverySettingsAction,
  listDeliveryZonesAction,
  updateDeliverySettingsAction,
  upsertDeliveryZoneAction,
} from "@/modules/delivery/actions/delivery.actions";
import type { DeliveryZoneDTO } from "@/modules/delivery/types/delivery.dto";
import { DeliverySettings } from "./delivery-settings";
import {
  buildDefaultZoneDraft,
  nextZoneSortOrder,
} from "./delivery-settings.helpers";
import type {
  DeliverySettingsLabels,
  DeliverySettingsValues,
  ZoneDraft,
  ZoneEditDraft,
} from "./delivery-settings.types";

function zoneErrorMessage(
  error: string,
  t: ReturnType<typeof useTranslations<"delivery.errors">>,
): string {
  if (error === "VALIDATION") return t("validation");
  if (error.toLowerCase().includes("duplicate")) return t("duplicateDistrict");
  return t("default");
}

export function DeliverySettingsContainer() {
  const t = useTranslations("delivery");
  const tErrors = useTranslations("delivery.errors");
  const queryClient = useQueryClient();

  const [settingsDraft, setSettingsDraft] = useState<DeliverySettingsValues>({
    pickupEnabled: true,
    deliveryEnabled: true,
    fallbackFee: 20,
  });
  const [zoneDraft, setZoneDraft] = useState<ZoneDraft>(buildDefaultZoneDraft);
  const [editingZone, setEditingZone] = useState<ZoneEditDraft | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const result = await listDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const result = await getDeliverySettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSettingsDraft(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const result = await updateDeliverySettingsAction(settingsDraft);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setSettingsError(null);
      await queryClient.invalidateQueries({ queryKey: ["delivery-settings"] });
    },
    onError: (error: Error) => {
      setSettingsError(zoneErrorMessage(error.message, tErrors));
    },
  });

  const saveZoneMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      district: string;
      fee: number;
      sortOrder: number;
      isActive: boolean;
    }) => {
      const result = await upsertDeliveryZoneAction(payload);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setZoneError(null);
      setZoneDraft(buildDefaultZoneDraft());
      setEditingZone(null);
      await queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
    onError: (error: Error) => {
      setZoneError(zoneErrorMessage(error.message, tErrors));
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDeliveryZoneAction(id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });

  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const labels: DeliverySettingsLabels = useMemo(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
      sectionGlobal: t("sectionGlobal"),
      pickupEnabled: t("pickupEnabled"),
      pickupHint: t("pickupHint"),
      deliveryEnabled: t("deliveryEnabled"),
      deliveryHint: t("deliveryHint"),
      fallbackFee: t("fallbackFee"),
      fallbackHint: t("fallbackHint"),
      saveSettings: t("saveSettings"),
      savingSettings: t("savingSettings"),
      settingsSaved: t("settingsSaved"),
      sectionZones: t("sectionZones"),
      district: t("district"),
      districtPlaceholder: t("districtPlaceholder"),
      fee: t("fee"),
      feePlaceholder: t("feePlaceholder"),
      addZone: t("addZone"),
      addingZone: t("addingZone"),
      columns: {
        district: t("columns.district"),
        fee: t("columns.fee"),
        status: t("columns.status"),
        order: t("columns.order"),
        actions: t("columns.actions"),
      },
      statusActive: t("statusActive"),
      statusInactive: t("statusInactive"),
      edit: t("edit"),
      delete: t("delete"),
      save: t("save"),
      cancel: t("cancel"),
      emptyZones: t("emptyZones"),
      formatPrice: (amount) => t("formatPrice", { amount: amount.toFixed(2) }),
      formatOrder: (order) => t("orderValue", { order }),
      formatPagination: (shown, total) => t("pagination", { shown, total }),
      formatAriaEdit: (district) => t("ariaEdit", { district }),
      formatAriaDelete: (district) => t("ariaDelete", { district }),
      infoTip: t("infoTip"),
      deleteConfirm: t("deleteConfirm"),
      errors: {
        validation: tErrors("validation"),
        duplicateDistrict: tErrors("duplicateDistrict"),
        default: tErrors("default"),
      },
    }),
    [t, tErrors],
  );

  function handleAddZone() {
    setZoneError(null);
    saveZoneMutation.mutate({
      district: zoneDraft.district.trim(),
      fee: zoneDraft.fee,
      sortOrder: nextZoneSortOrder(zones),
      isActive: true,
    });
  }

  function handleStartEditZone(zone: DeliveryZoneDTO) {
    setZoneError(null);
    setEditingZone({
      id: zone.id,
      district: zone.district,
      fee: zone.fee,
      sortOrder: zone.sortOrder,
      isActive: zone.isActive,
    });
  }

  function handleSaveEditZone() {
    if (!editingZone) return;
    setZoneError(null);
    saveZoneMutation.mutate({
      id: editingZone.id,
      district: editingZone.district.trim(),
      fee: editingZone.fee,
      sortOrder: editingZone.sortOrder,
      isActive: editingZone.isActive,
    });
  }

  function handleToggleZoneActive(zone: DeliveryZoneDTO) {
    setZoneError(null);
    saveZoneMutation.mutate({
      id: zone.id,
      district: zone.district,
      fee: zone.fee,
      sortOrder: zone.sortOrder,
      isActive: !zone.isActive,
    });
  }

  function handleDeleteZone(id: string) {
    const zone = zones.find((item) => item.id === id);
    if (!zone) return;
    if (!window.confirm(labels.deleteConfirm)) return;
    deleteZoneMutation.mutate(id);
  }

  if (zonesQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col lg:p-8">
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {labels.loading}
          </p>
        </div>
      </div>
    );
  }

  if (zonesQuery.isError || settingsQuery.isError) {
    return (
      <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col lg:p-8">
        <div className="border-error/20 bg-error-container/40 rounded-4xl border p-12 text-center">
          <p className="font-body text-body-md text-on-error-container">
            {labels.loadError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-8 lg:p-8">
      <DeliverySettings
        settings={settingsDraft}
        zones={zones}
        zoneDraft={zoneDraft}
        editingZone={editingZone}
        labels={labels}
        settingsSubmitting={saveSettingsMutation.isPending}
        zoneSubmitting={saveZoneMutation.isPending}
        deletingZoneId={
          deleteZoneMutation.isPending
            ? (deleteZoneMutation.variables ?? null)
            : null
        }
        settingsError={settingsError}
        zoneError={zoneError}
        onSettingsChange={setSettingsDraft}
        onSaveSettings={() => saveSettingsMutation.mutate()}
        onZoneDraftChange={setZoneDraft}
        onAddZone={handleAddZone}
        onStartEditZone={handleStartEditZone}
        onCancelEditZone={() => setEditingZone(null)}
        onEditZoneChange={setEditingZone}
        onSaveEditZone={handleSaveEditZone}
        onToggleZoneActive={handleToggleZoneActive}
        onDeleteZone={handleDeleteZone}
      />
    </div>
  );
}

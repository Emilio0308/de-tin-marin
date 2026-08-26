"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  deleteDeliveryZoneAction,
  listDeliveryZonesAction,
  upsertDeliveryZoneAction,
} from "@/modules/delivery/actions/delivery.actions";
import { useConfirmDialog } from "@/shared/components/confirm-dialog/confirm-dialog";
import type { DeliveryZoneDTO } from "@/modules/delivery/types/delivery.dto";
import { DeliverySettings } from "./delivery-settings";
import {
  buildDefaultZoneDraft,
  nextZoneSortOrder,
} from "./delivery-settings.helpers";
import type {
  DeliveryZonesLabels,
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
  const tFeedback = useTranslations("common");
  const { confirm, dialog } = useConfirmDialog();
  const queryClient = useQueryClient();

  const [zoneDraft, setZoneDraft] = useState<ZoneDraft>(buildDefaultZoneDraft);
  const [editingZone, setEditingZone] = useState<ZoneEditDraft | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const result = await listDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
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

  const labels: DeliveryZonesLabels = useMemo(
    () => ({
      title: t("zonesTitle"),
      subtitle: t("zonesSubtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
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

  async function handleDeleteZone(id: string) {
    const zone = zones.find((item) => item.id === id);
    if (!zone) return;
    const accepted = await confirm({
      description: labels.deleteConfirm,
    });
    if (!accepted) return;
    deleteZoneMutation.mutate(id, {
      onSuccess: () => toast.success(tFeedback("confirmDialog.deleteSuccess")),
      onError: () => toast.error(tFeedback("error")),
    });
  }

  if (zonesQuery.isLoading) {
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

  if (zonesQuery.isError) {
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
    <>
      {dialog}
      <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-8 lg:px-8 lg:pb-8">
        <DeliverySettings
          zones={zones}
          zoneDraft={zoneDraft}
          editingZone={editingZone}
          labels={labels}
          zoneSubmitting={saveZoneMutation.isPending}
          deletingZoneId={
            deleteZoneMutation.isPending
              ? (deleteZoneMutation.variables ?? null)
              : null
          }
          zoneError={zoneError}
          onZoneDraftChange={setZoneDraft}
          onAddZone={handleAddZone}
          onStartEditZone={handleStartEditZone}
          onCancelEditZone={() => setEditingZone(null)}
          onEditZoneChange={setEditingZone}
          onSaveEditZone={handleSaveEditZone}
          onToggleZoneActive={handleToggleZoneActive}
          onDeleteZone={(id) => {
            void handleDeleteZone(id);
          }}
        />
      </div>
    </>
  );
}

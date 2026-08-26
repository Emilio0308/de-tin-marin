"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  deletePickupPointAction,
  listPickupPointsAction,
  upsertPickupPointAction,
} from "@/modules/delivery/actions/pickup-point.actions";
import { useConfirmDialog } from "@/shared/components/confirm-dialog/confirm-dialog";
import type { PickupPointDTO } from "@/modules/delivery/types/delivery.dto";
import {
  buildDefaultPickupPointDraft,
  nextPickupPointSortOrder,
} from "./pickup-points.helpers";
import { PickupPoints } from "./pickup-points";
import type {
  PickupPointDraft,
  PickupPointEditDraft,
  PickupPointsLabels,
} from "./pickup-points.types";

function pointErrorMessage(
  error: string,
  t: ReturnType<typeof useTranslations<"delivery.pickupPoints.errors">>,
): string {
  if (error === "VALIDATION") return t("validation");
  if (error.toLowerCase().includes("duplicate")) return t("duplicateName");
  return t("default");
}

export function PickupPointsContainer({ isActive }: { isActive: boolean }) {
  const t = useTranslations("delivery.pickupPoints");
  const tErrors = useTranslations("delivery.pickupPoints.errors");
  const tFeedback = useTranslations("common");
  const { confirm, dialog } = useConfirmDialog();
  const queryClient = useQueryClient();

  const [pointDraft, setPointDraft] = useState<PickupPointDraft>(
    buildDefaultPickupPointDraft,
  );
  const [editingPoint, setEditingPoint] = useState<PickupPointEditDraft | null>(
    null,
  );
  const [pointError, setPointError] = useState<string | null>(null);

  const pointsQuery = useQuery({
    queryKey: ["pickup-points"],
    queryFn: async () => {
      const result = await listPickupPointsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const savePointMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      lat: number;
      lng: number;
      fee: number;
      sortOrder: number;
      isActive: boolean;
    }) => {
      const result = await upsertPickupPointAction(payload);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setPointError(null);
      setPointDraft(buildDefaultPickupPointDraft());
      setEditingPoint(null);
      await queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
    },
    onError: (error: Error) => {
      setPointError(pointErrorMessage(error.message, tErrors));
    },
  });

  const deletePointMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePickupPointAction(id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pickup-points"] });
    },
  });

  const points = useMemo(() => pointsQuery.data ?? [], [pointsQuery.data]);

  const labels: PickupPointsLabels = useMemo(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
      sectionPoints: t("sectionPoints"),
      name: t("name"),
      namePlaceholder: t("namePlaceholder"),
      fee: t("fee"),
      feePlaceholder: t("feePlaceholder"),
      mapHint: t("mapHint"),
      mapSearchLabel: t("mapSearchLabel"),
      mapSearchPlaceholder: t("mapSearchPlaceholder"),
      mapSearchNoResults: t("mapSearchNoResults"),
      addPoint: t("addPoint"),
      addingPoint: t("addingPoint"),
      columns: {
        name: t("columns.name"),
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
      emptyPoints: t("emptyPoints"),
      formatPrice: (amount) => t("formatPrice", { amount }),
      formatOrder: (order) => t("orderValue", { order }),
      formatPagination: (shown, total) => t("pagination", { shown, total }),
      formatAriaEdit: (name) => t("ariaEdit", { name }),
      formatAriaDelete: (name) => t("ariaDelete", { name }),
      deleteConfirm: t("deleteConfirm"),
      errors: {
        validation: tErrors("validation"),
        duplicateName: tErrors("duplicateName"),
        default: tErrors("default"),
      },
    }),
    [t, tErrors],
  );

  function handleAddPoint() {
    setPointError(null);
    savePointMutation.mutate({
      name: pointDraft.name.trim(),
      lat: pointDraft.lat,
      lng: pointDraft.lng,
      fee: pointDraft.fee,
      sortOrder: nextPickupPointSortOrder(points),
      isActive: true,
    });
  }

  function handleStartEditPoint(point: PickupPointDTO) {
    setPointError(null);
    setEditingPoint({
      id: point.id,
      name: point.name,
      lat: point.lat,
      lng: point.lng,
      fee: point.fee,
      sortOrder: point.sortOrder,
      isActive: point.isActive,
    });
  }

  function handleSaveEditPoint() {
    if (!editingPoint) return;
    setPointError(null);
    savePointMutation.mutate({
      id: editingPoint.id,
      name: editingPoint.name.trim(),
      lat: editingPoint.lat,
      lng: editingPoint.lng,
      fee: editingPoint.fee,
      sortOrder: editingPoint.sortOrder,
      isActive: editingPoint.isActive,
    });
  }

  function handleTogglePointActive(point: PickupPointDTO) {
    setPointError(null);
    savePointMutation.mutate({
      id: point.id,
      name: point.name,
      lat: point.lat,
      lng: point.lng,
      fee: point.fee,
      sortOrder: point.sortOrder,
      isActive: !point.isActive,
    });
  }

  async function handleDeletePoint(id: string) {
    const point = points.find((item) => item.id === id);
    if (!point) return;
    const accepted = await confirm({
      description: labels.deleteConfirm,
    });
    if (!accepted) return;
    deletePointMutation.mutate(id, {
      onSuccess: () => toast.success(tFeedback("confirmDialog.deleteSuccess")),
      onError: () => toast.error(tFeedback("error")),
    });
  }

  if (pointsQuery.isLoading) {
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

  if (pointsQuery.isError) {
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
      <div className="gap-stack-lg px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-8 lg:p-8">
        <PickupPoints
          points={points}
          pointDraft={pointDraft}
          editingPoint={editingPoint}
          isMapVisible={isActive}
          labels={labels}
          pointSubmitting={savePointMutation.isPending}
          deletingPointId={
            deletePointMutation.isPending
              ? (deletePointMutation.variables ?? null)
              : null
          }
          pointError={pointError}
          onPointDraftChange={setPointDraft}
          onAddPoint={handleAddPoint}
          onStartEditPoint={handleStartEditPoint}
          onCancelEditPoint={() => setEditingPoint(null)}
          onEditPointChange={setEditingPoint}
          onSaveEditPoint={handleSaveEditPoint}
          onTogglePointActive={handleTogglePointActive}
          onDeletePoint={(id) => {
            void handleDeletePoint(id);
          }}
          onMapPinChange={(pin) => {
            if (editingPoint) {
              setEditingPoint({ ...editingPoint, ...pin });
            } else {
              setPointDraft({ ...pointDraft, ...pin });
            }
          }}
        />
      </div>
    </>
  );
}

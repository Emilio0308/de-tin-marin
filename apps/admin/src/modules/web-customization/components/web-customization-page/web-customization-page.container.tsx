"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createHeroImageAction,
  deleteHeroImageAction,
  getHeroSettingsAction,
  listHeroImagesAction,
  reorderHeroImagesAction,
  updateHeroImageAction,
  updateHeroSettingsAction,
} from "@/modules/web-customization/actions/hero.actions";
import { validateHeroImageFile } from "@/modules/web-customization/helpers/hero-image-file";
import type {
  HeroDisplayMode,
  HeroImageDTO,
  HeroSettingsDTO,
} from "@/modules/web-customization/types/hero.dto";
import { createCatalogImageUploadUrlAction } from "@/modules/media/actions/create-catalog-image-upload-url";
import { putPresignedCatalogImage } from "@/modules/media/lib/put-presigned-catalog-image";
import type { CatalogImageContentType } from "@/modules/media/schemas/presign-catalog-image.schema";
import { logClientError } from "@/shared/errors/client-error";
import { WebCustomizationPage } from "./web-customization-page";
import {
  emptyImageDraft,
  fromDatetimeLocalValue,
  draftHasPersistableImage,
  moveImageOrder,
  toImageDraft,
} from "./web-customization-page.helpers";
import type {
  HeroImageDraft,
  WebCustomizationLabels,
} from "./web-customization-page.types";

const DEFAULT_SETTINGS: HeroSettingsDTO = { displayMode: "static" };

export function WebCustomizationPageContainer() {
  const t = useTranslations("webCustomization");
  const tErrors = useTranslations("webCustomization.errors");
  const queryClient = useQueryClient();

  const [settingsDraft, setSettingsDraft] =
    useState<HeroSettingsDTO>(DEFAULT_SETTINGS);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [draft, setDraft] = useState<HeroImageDraft | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["hero-settings"],
    queryFn: async () => {
      const result = await getHeroSettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data ?? DEFAULT_SETTINGS;
    },
  });

  const imagesQuery = useQuery({
    queryKey: ["hero-images"],
    queryFn: async () => {
      const result = await listHeroImagesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettingsDraft(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const labels: WebCustomizationLabels = useMemo(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      loading: t("loading"),
      loadError: t("loadError"),
      sectionMode: t("sectionMode"),
      modeStatic: t("modeStatic"),
      modeCarousel: t("modeCarousel"),
      modeHint: t("modeHint"),
      saveSettings: t("saveSettings"),
      savingSettings: t("savingSettings"),
      settingsSaved: t("settingsSaved"),
      sectionPreview: t("sectionPreview"),
      previewEmpty: t("previewEmpty"),
      previewPrev: t("previewPrev"),
      previewNext: t("previewNext"),
      sectionImages: t("sectionImages"),
      addImage: t("addImage"),
      imageRequirements: t("imageRequirements"),
      altText: t("altText"),
      altPlaceholder: t("altPlaceholder"),
      startsAt: t("startsAt"),
      endsAt: t("endsAt"),
      saveImage: t("saveImage"),
      savingImage: t("savingImage"),
      cancel: t("cancel"),
      delete: t("delete"),
      moveUp: t("moveUp"),
      moveDown: t("moveDown"),
      emptyImages: t("emptyImages"),
      columnsPreview: t("columns.preview"),
      columnsOrder: t("columns.order"),
      columnsDates: t("columns.dates"),
      columnsActions: t("columns.actions"),
      deleteConfirm: t("deleteConfirm"),
      infoTip: t("infoTip"),
      pickImage: t("pickImage"),
      changeImage: t("changeImage"),
      pickImageHint: t("pickImageHint"),
    }),
    [t],
  );

  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: HeroSettingsDTO) => {
      const result = await updateHeroSettingsAction(payload);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setSettingsError(null);
      setSettingsMessage(labels.settingsSaved);
      await queryClient.invalidateQueries({ queryKey: ["hero-settings"] });
    },
    onError: (error) => {
      setSettingsMessage(null);
      setSettingsError(
        error.message === "VALIDATION"
          ? tErrors("validation")
          : tErrors("default"),
      );
    },
  });

  const imageMutation = useMutation({
    mutationFn: async () => {
      if (!draft) {
        throw new Error("NO_DRAFT");
      }
      if (!draftHasPersistableImage(draft)) {
        throw new Error("MISSING_IMAGE");
      }

      let imageUrl = draft.imageUrl.trim();
      if (draft.pendingFile) {
        const file = draft.pendingFile;
        const uploadUrlResult = await createCatalogImageUploadUrlAction({
          folder: "hero",
          contentType: file.type as CatalogImageContentType,
          contentLength: file.size,
          fileName: file.name,
        });
        if (!uploadUrlResult.ok) {
          throw new Error(uploadUrlResult.error);
        }
        const put = await putPresignedCatalogImage(
          uploadUrlResult.data.uploadUrl,
          file,
        );
        if (!put.ok) {
          throw new Error("UPLOAD_FAILED");
        }
        imageUrl = uploadUrlResult.data.publicUrl;
      }

      if (!imageUrl || imageUrl.startsWith("blob:")) {
        throw new Error("MISSING_IMAGE");
      }

      const payload = {
        id: draft.id ?? undefined,
        imageUrl,
        altText: draft.altText.trim() || null,
        sortOrder: draft.sortOrder,
        startsAt: fromDatetimeLocalValue(draft.startsAtLocal),
        endsAt: fromDatetimeLocalValue(draft.endsAtLocal),
      };

      const result = draft.id
        ? await updateHeroImageAction(payload)
        : await createHeroImageAction(payload);

      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setImageError(null);
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : "default";
      if (code !== "MISSING_IMAGE") {
        logClientError("saveHeroImage", error);
      }
      setImageError(imageErrorMessage(code, tErrors));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteHeroImageAction(id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const result = await reorderHeroImagesAction({ orderedIds });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    },
  });

  async function handlePickFile(file: File | null) {
    if (!draft) return;
    if (!file) return;

    setImageError(null);
    const validation = await validateHeroImageFile(file);
    if (!validation.ok) {
      setImageError(imageErrorMessage(validation.error, tErrors));
      return;
    }

    if (draft.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.previewUrl);
    }

    setDraft({
      ...draft,
      pendingFile: file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  function handleCancelDraft() {
    if (draft?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.previewUrl);
    }
    setDraft(null);
    setImageError(null);
  }

  function handleStartAdd() {
    const sortOrder = imagesQuery.data?.length ?? 0;
    setImageError(null);
    setDraft(emptyImageDraft(sortOrder));
  }

  function handleStartEdit(image: HeroImageDTO) {
    setImageError(null);
    setDraft(toImageDraft(image));
  }

  function handleDelete(id: string) {
    if (!window.confirm(labels.deleteConfirm)) return;
    deleteMutation.mutate(id);
  }

  function handleMove(id: string, direction: "up" | "down") {
    const images = imagesQuery.data ?? [];
    const orderedIds = moveImageOrder(images, id, direction);
    if (!orderedIds) return;
    reorderMutation.mutate(orderedIds);
  }

  function handleSaveDraft() {
    if (!draft) return;
    if (!draftHasPersistableImage(draft)) {
      setImageError(tErrors("missingImage"));
      return;
    }
    setImageError(null);
    imageMutation.mutate();
  }

  const loading = settingsQuery.isLoading || imagesQuery.isLoading;
  const loadError =
    settingsQuery.isError || imagesQuery.isError ? labels.loadError : null;
  const canSaveDraft = draft ? draftHasPersistableImage(draft) : false;

  return (
    <WebCustomizationPage
      labels={labels}
      settings={settingsDraft}
      images={imagesQuery.data ?? []}
      loading={loading}
      loadError={loadError}
      settingsSubmitting={saveSettingsMutation.isPending}
      settingsMessage={settingsMessage}
      settingsError={settingsError}
      imageError={imageError}
      draft={draft}
      imageSubmitting={imageMutation.isPending}
      canSaveDraft={canSaveDraft}
      onDisplayModeChange={(mode: HeroDisplayMode) => {
        setSettingsMessage(null);
        setSettingsDraft({ displayMode: mode });
      }}
      onSaveSettings={() => saveSettingsMutation.mutate(settingsDraft)}
      onStartAdd={handleStartAdd}
      onStartEdit={handleStartEdit}
      onCancelDraft={handleCancelDraft}
      onDraftChange={setDraft}
      onPickFile={(file) => {
        void handlePickFile(file);
      }}
      onSaveDraft={handleSaveDraft}
      onDelete={handleDelete}
      onMove={handleMove}
    />
  );
}

function imageErrorMessage(
  code: string,
  t: ReturnType<typeof useTranslations<"webCustomization.errors">>,
): string {
  switch (code) {
    case "INVALID_TYPE":
      return t("invalidType");
    case "INVALID_SIZE":
      return t("invalidSize");
    case "INVALID_DIMENSIONS":
      return t("invalidDimensions");
    case "TOO_SMALL":
      return t("tooSmall");
    case "MISSING_IMAGE":
      return t("missingImage");
    case "UPLOAD_FAILED":
      return t("uploadFailed");
    case "VALIDATION":
      return t("validation");
    default:
      return t("default");
  }
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { exportCatalogStatusAction } from "@/modules/reports/actions/export-catalog-status";
import { triggerExcelDownload } from "@/modules/reports/helpers/trigger-excel-download";
import type { CatalogStatusSection } from "@/modules/reports/schemas/export-catalog-status.schema";
import { CatalogExportPanel } from "./catalog-export-panel";
import {
  defaultSelectedSections,
  selectedSectionsList,
} from "./catalog-export-panel.helpers";

export function CatalogExportPanelContainer() {
  const t = useTranslations("dashboard.catalogExport");
  const [selected, setSelected] = useState(defaultSelectedSections);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  function onToggle(id: CatalogStatusSection) {
    if (downloading) return;
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setError(null);
  }

  async function onDownload() {
    const sections = selectedSectionsList(selected);
    if (sections.length === 0 || downloading) return;

    setError(null);
    setDownloading(true);
    try {
      const result = await exportCatalogStatusAction({ sections });
      if (!result.ok || !("data" in result)) {
        setError("error");
        return;
      }
      triggerExcelDownload(result.data.filename, result.data.base64);
    } catch {
      setError("error");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <CatalogExportPanel
      title={t("title")}
      description={t("description")}
      downloadLabel={t("download")}
      downloadingLabel={t("downloading")}
      emptySelectionLabel={t("emptySelection")}
      errorLabel={t("error")}
      sections={[
        { id: "products", label: t("sections.products") },
        { id: "bundles", label: t("sections.bundles") },
        { id: "packs", label: t("sections.packs") },
        { id: "containers", label: t("sections.containers") },
        { id: "orders", label: t("sections.orders") },
      ]}
      selected={selected}
      downloading={downloading}
      error={error}
      onToggle={onToggle}
      onDownload={() => {
        void onDownload();
      }}
    />
  );
}

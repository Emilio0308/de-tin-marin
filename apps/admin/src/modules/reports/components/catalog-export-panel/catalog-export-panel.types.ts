import type { CatalogStatusSection } from "@/modules/reports/schemas/export-catalog-status.schema";

export type CatalogExportSectionOption = {
  id: CatalogStatusSection;
  label: string;
};

export type CatalogExportPanelProps = {
  title: string;
  description: string;
  downloadLabel: string;
  downloadingLabel: string;
  emptySelectionLabel: string;
  errorLabel: string;
  sections: CatalogExportSectionOption[];
  selected: Record<CatalogStatusSection, boolean>;
  downloading: boolean;
  error: string | null;
  onToggle: (id: CatalogStatusSection) => void;
  onDownload: () => void;
};

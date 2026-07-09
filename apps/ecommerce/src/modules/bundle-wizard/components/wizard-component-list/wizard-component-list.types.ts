import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";

export type WizardComponentListProps = {
  components: CustomizeBundleComponent[];
  personCount: number;
  labelsByProductId: Record<string, string>;
  imagesByProductId: Record<string, string>;
  labels: {
    title: string;
    remove: string;
    minReached: string;
    count: string;
    progressLabel: string;
    formatQuantityBreakdown: (values: {
      perPerson: number;
      surprises: number;
      total: number;
    }) => string;
  };
  canRemove: boolean;
  onRemove: (productId: string) => void;
};

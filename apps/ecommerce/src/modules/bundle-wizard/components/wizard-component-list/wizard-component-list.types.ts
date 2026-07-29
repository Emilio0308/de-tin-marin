import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";

export type WizardComponentListProps = {
  components: CustomizeBundleComponent[];
  personCount: number;
  labelsByProductId: Record<string, string>;
  imagesByProductId: Record<string, string>;
  unitPricesByProductId: Record<string, number>;
  canRemove: boolean;
  onRemove: (productId: string) => void;
};

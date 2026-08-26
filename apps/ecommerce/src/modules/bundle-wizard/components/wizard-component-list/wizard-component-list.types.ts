import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";

export type WizardComponentListProps = {
  components: CustomizeBundleComponent[];
  personCount: number;
  minProducts: number;
  maxProducts: number;
  labelsByProductId: Record<string, string>;
  imagesByProductId: Record<string, string>;
  unitPricesByProductId: Record<string, number>;
  canRemove: boolean;
  enableUnitsPerPerson: boolean;
  onRemove: (productId: string) => void;
  onQuantityPerUnitChange: (productId: string, quantityPerUnit: number) => void;
};

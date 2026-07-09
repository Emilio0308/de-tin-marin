export const storeFeatures = {
  enableUnitsPerPerson: false,
  pickupEnabled: false,
  strictStockValidationOnCheckout: false,
} as const;

export type StoreFeatures = typeof storeFeatures;

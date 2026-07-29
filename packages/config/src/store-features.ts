export const storeFeatures = {
  enableUnitsPerPerson: false,
  pickupEnabled: false,
  strictStockValidationOnCheckout: true,
} as const;

export type StoreFeatures = typeof storeFeatures;

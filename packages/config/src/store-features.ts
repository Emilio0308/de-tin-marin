export const storeFeatures = {
  enableUnitsPerPerson: true,
  pickupEnabled: false,
  strictStockValidationOnCheckout: true,
} as const;

export type StoreFeatures = typeof storeFeatures;

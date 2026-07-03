import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import type {
  BundleFormItemValues,
  BundleFormValues,
  ProductOption,
} from "./bundle-form.types";
import type { BundleFormDTO } from "@/modules/catalog/types/bundle.dto";

export function buildDefaultBundleValues(
  initial?: BundleFormDTO,
): BundleFormValues {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    serviceFee: initial?.serviceFee ?? 0,
    quantity: initial?.quantity ?? 1,
    isActive: initial?.isActive ?? true,
    items:
      initial?.items.map((item) => ({
        productId: item.productId,
        unitsPerPerson: item.unitsPerPerson,
      })) ?? [],
  };
}

export function computeLiveTotal(
  values: Pick<BundleFormValues, "serviceFee" | "quantity" | "items">,
  products: ProductOption[],
) {
  const priceById = new Map(
    products.map((product) => [product.id, product.netPrice]),
  );

  return computeBundleTotal({
    serviceFee: values.serviceFee,
    quantity: values.quantity,
    items: values.items.map((item) => ({
      unitNetPrice: priceById.get(item.productId) ?? 0,
      unitsPerPerson: item.unitsPerPerson,
    })),
  });
}

export function addBundleItem(
  items: BundleFormItemValues[],
  productId: string,
): BundleFormItemValues[] {
  if (!productId || items.some((item) => item.productId === productId)) {
    return items;
  }

  return [...items, { productId, unitsPerPerson: 1 }];
}

export function removeBundleItem(
  items: BundleFormItemValues[],
  productId: string,
): BundleFormItemValues[] {
  return items.filter((item) => item.productId !== productId);
}

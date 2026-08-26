import {
  buildShoppingCart,
  computeOrderTotals,
  type BuildBundleLineInput,
  type BuildPackLineInput,
  type BuildProductLineInput,
  type OrderShoppingCartLine,
  type ProductForOrderLine,
} from "@de-tin-marin/shared/order-cart";
import type {
  OrderFormLine,
  OrderFormValues,
  PackOption,
  ProductOption,
} from "./order-form.types";

type BundleMeta = {
  name: string;
  container: {
    containerId: string;
    sku: string;
    name: string;
    unitPrice: number;
  };
};

type PackMeta = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  components: Array<{
    productId: string;
    packageQuantity: number;
    unitQuantity: number;
  }>;
};

function buildProductsByIdForLine(
  line: OrderFormLine,
  products: ProductOption[],
  packsById: Map<string, PackMeta>,
): Map<string, ProductForOrderLine> {
  const map = new Map<string, ProductForOrderLine>();

  if (line.type === "product") {
    const product = products.find((item) => item.id === line.productId);
    if (product) {
      map.set(product.id, {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unitPrice: product.finalUnitPrice,
        presentationPrice: product.finalPrice,
        itemsPerPackage: product.itemsPerPackage,
      });
    }
    return map;
  }

  if (line.type === "pack") {
    const pack = packsById.get(line.packId);
    if (!pack) return map;
    const componentIds = new Set(pack.components.map((c) => c.productId));
    for (const product of products) {
      if (!componentIds.has(product.id)) continue;
      map.set(product.id, {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unitPrice: product.finalUnitPrice,
        presentationPrice: product.finalPrice,
        itemsPerPackage: product.itemsPerPackage,
      });
    }
    return map;
  }

  const componentIds = new Set(
    line.components.map((component) => component.productId),
  );
  for (const product of products) {
    if (!componentIds.has(product.id)) continue;
    map.set(product.id, {
      id: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.finalUnitPrice,
      presentationPrice: product.finalPrice,
      itemsPerPackage: product.itemsPerPackage,
    });
  }

  return map;
}

function toBuildLine(
  line: OrderFormLine,
  bundlesById: Map<string, BundleMeta>,
  packsById: Map<string, PackMeta>,
): BuildProductLineInput | BuildBundleLineInput | BuildPackLineInput | null {
  if (line.type === "product") {
    return line;
  }

  if (line.type === "pack") {
    const pack = packsById.get(line.packId);
    if (!pack) return null;
    return {
      type: "pack",
      packId: pack.id,
      quantity: line.quantity,
      pack: {
        id: pack.id,
        sku: pack.sku,
        name: pack.name,
        unitPrice: pack.unitPrice,
      },
      components: pack.components,
    };
  }

  const bundle = bundlesById.get(line.bundleId);
  if (!bundle) return null;

  return {
    type: "bundle",
    bundleId: line.bundleId,
    name: bundle.name,
    quantity: line.quantity,
    container: bundle.container,
    components: line.components,
  };
}

/** Fallback cliente cuando el preview server no está disponible. */
export function estimateOrderFormLineTotal(
  line: OrderFormLine,
  products: ProductOption[],
  bundlesById: Map<string, BundleMeta>,
  packsById: Map<string, PackMeta> = new Map(),
): number | null {
  if (line.type === "pack") {
    const pack = packsById.get(line.packId);
    if (!pack) return null;
    return Math.round(pack.unitPrice * line.quantity * 100) / 100;
  }

  const buildLine = toBuildLine(line, bundlesById, packsById);
  if (!buildLine) return null;

  const productsById = buildProductsByIdForLine(line, products, packsById);

  try {
    const shoppingCart = buildShoppingCart({
      lines: [buildLine],
      productsById,
    });
    return shoppingCart.lines[0]?.lineTotal ?? null;
  } catch {
    return null;
  }
}

/** Fallback cliente cuando el preview server no está disponible. */
export function previewOrderTotals(
  values: Pick<
    OrderFormValues,
    "lines" | "shippingTotal" | "discountTotal" | "surchargeTotal"
  >,
  products: ProductOption[],
  bundlesById: Map<string, BundleMeta>,
  packsById: Map<string, PackMeta> = new Map(),
) {
  if (values.lines.length === 0) {
    return computeOrderTotals({ lines: [] }, values);
  }

  const builtLines: OrderShoppingCartLine[] = [];

  try {
    for (const line of values.lines) {
      if (line.type === "pack") {
        const pack = packsById.get(line.packId);
        if (!pack) continue;
        const unitPrice = pack.unitPrice;
        builtLines.push({
          type: "pack",
          packId: pack.id,
          sku: pack.sku,
          name: pack.name,
          quantity: line.quantity,
          unitPrice,
          lineTotal: Math.round(unitPrice * line.quantity * 100) / 100,
          components: [],
        });
        continue;
      }

      const buildLine = toBuildLine(line, bundlesById, packsById);
      if (!buildLine) continue;

      const shoppingCart = buildShoppingCart({
        lines: [buildLine],
        productsById: buildProductsByIdForLine(line, products, packsById),
      });
      const built = shoppingCart.lines[0];
      if (built) builtLines.push(built);
    }

    return computeOrderTotals(
      { lines: builtLines },
      {
        shippingTotal: values.shippingTotal,
        discountTotal: values.discountTotal,
        surchargeTotal: values.surchargeTotal,
      },
    );
  } catch {
    return null;
  }
}

export type PickupPointFormOption = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fee: number;
};

export type CourierDepartmentFormOption = {
  id: string;
  name: string;
  provinces: Array<{ slug: string; name: string; enabled: boolean }>;
};

export function toCreateOrderPayload(
  values: OrderFormValues,
  pickupPoints: PickupPointFormOption[] = [],
  courierDepartments: CourierDepartmentFormOption[] = [],
) {
  const selectedPickupPoint =
    values.fulfillment.method === "pickup_point"
      ? pickupPoints.find(
          (point) => point.id === values.fulfillment.pickupPointId,
        )
      : undefined;

  const selectedCourierDepartment =
    values.fulfillment.method === "courier"
      ? courierDepartments.find(
          (department) =>
            department.id === values.fulfillment.courierDepartmentId,
        )
      : undefined;
  const selectedCourierProvince = selectedCourierDepartment?.provinces.find(
    (province) =>
      province.slug === values.fulfillment.courierProvinceSlug &&
      province.enabled,
  );

  return {
    contact: values.contact,
    fulfillment: {
      method: values.fulfillment.method,
      deliveryAddress:
        values.fulfillment.method === "delivery"
          ? {
              ...values.fulfillment.deliveryAddress,
              reference: values.fulfillment.deliveryAddress.reference || null,
            }
          : undefined,
      pickupPoint:
        values.fulfillment.method === "pickup_point" && selectedPickupPoint
          ? {
              id: selectedPickupPoint.id,
              name: selectedPickupPoint.name,
              lat: selectedPickupPoint.lat,
              lng: selectedPickupPoint.lng,
              fee: selectedPickupPoint.fee,
            }
          : undefined,
      courier:
        values.fulfillment.method === "courier" &&
        selectedCourierDepartment &&
        selectedCourierProvince
          ? {
              destination: {
                departmentId: selectedCourierDepartment.id,
                departmentName: selectedCourierDepartment.name,
                provinceSlug: selectedCourierProvince.slug,
                provinceName: selectedCourierProvince.name,
              },
              recipient: {
                dni: values.fulfillment.courierDni.trim(),
                fullName: values.fulfillment.courierFullName.trim(),
                agencyAddress: values.fulfillment.courierAgencyAddress.trim(),
              },
            }
          : undefined,
      notes: values.fulfillment.notes || null,
    },
    lines: values.lines.map((line) => {
      if (line.type === "product") return line;
      if (line.type === "pack") {
        return {
          type: "pack" as const,
          packId: line.packId,
          quantity: line.quantity,
        };
      }
      return {
        type: "bundle" as const,
        bundleId: line.bundleId,
        quantity: line.quantity,
        components: line.components,
      };
    }),
    shippingTotal: values.shippingTotal,
    discountTotal: values.discountTotal,
    surchargeTotal: values.surchargeTotal,
  };
}

export function buildPackMetaFromOptions(
  packs: PackOption[],
): Map<string, PackMeta> {
  return new Map(
    packs.map((pack) => [
      pack.id,
      {
        id: pack.id,
        sku: pack.sku,
        name: pack.name,
        unitPrice: pack.finalPrice,
        components: [],
      },
    ]),
  );
}

export type { BundleMeta, PackMeta };

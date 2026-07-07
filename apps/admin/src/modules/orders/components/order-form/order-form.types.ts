export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  finalPrice: number;
};

export type BundleOption = {
  id: string;
  name: string;
  containerId: string;
  containerName: string;
  containerNetPrice: number;
};

export type OrderFormProductLine = {
  type: "product";
  productId: string;
  quantity: number;
};

export type OrderFormBundleComponent = {
  productId: string;
  quantityPerUnit: number;
};

export type OrderFormBundleLine = {
  type: "bundle";
  bundleId: string;
  quantity: number;
  components: OrderFormBundleComponent[];
};

export type OrderFormLine = OrderFormProductLine | OrderFormBundleLine;

export type OrderFormValues = {
  contact: {
    name: string;
    lastName: string;
    phone: string;
    email: string;
  };
  fulfillment: {
    method: "delivery" | "pickup";
    deliveryAddress: {
      recipientName: string;
      line1: string;
      district: string;
      city: string;
      province: string;
      reference: string;
      phone: string;
    };
    notes: string;
  };
  lines: OrderFormLine[];
  shippingTotal: number;
  discountTotal: number;
};

export const emptyOrderFormValues: OrderFormValues = {
  contact: {
    name: "",
    lastName: "",
    phone: "",
    email: "",
  },
  fulfillment: {
    method: "delivery",
    deliveryAddress: {
      recipientName: "",
      line1: "",
      district: "",
      city: "Piura",
      province: "Piura",
      reference: "",
      phone: "",
    },
    notes: "",
  },
  lines: [],
  shippingTotal: 0,
  discountTotal: 0,
};

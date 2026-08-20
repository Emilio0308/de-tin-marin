import {
  createOrderInputSchema,
  type CreateOrderInput,
} from "@de-tin-marin/validations/order";
import type { ZodIssue } from "zod";
import {
  toCreateOrderPayload,
  type PickupPointFormOption,
} from "../components/order-form/order-form.helpers";
import type {
  OrderFormFieldErrors,
  OrderFormValues,
} from "../components/order-form/order-form.types";

/** Claves i18n bajo `orders.form.validation.*` (sin copy hardcodeado). */
export type OrderFormValidationKey =
  | "requiredName"
  | "requiredLastName"
  | "requiredPhone"
  | "invalidEmail"
  | "requiredDeliveryAddress"
  | "requiredRecipient"
  | "requiredLine1"
  | "requiredDistrict"
  | "requiredCity"
  | "requiredProvince"
  | "requiredDeliveryPhone"
  | "requiredLines"
  | "invalidName"
  | "tooShortName"
  | "invalidPhone"
  | "tooShortAddress"
  | "invalidField"
  | "reviewForm";

export type OrderFormFieldErrorKeys = Record<string, OrderFormValidationKey>;

export const customerDeliveryFieldPaths = [
  "contact.name",
  "contact.lastName",
  "contact.phone",
  "contact.email",
  "fulfillment.deliveryAddress.recipientName",
  "fulfillment.deliveryAddress.line1",
  "fulfillment.deliveryAddress.district",
  "fulfillment.deliveryAddress.city",
  "fulfillment.deliveryAddress.province",
  "fulfillment.deliveryAddress.reference",
  "fulfillment.deliveryAddress.phone",
] as const;

export type CustomerDeliveryFieldPath =
  (typeof customerDeliveryFieldPaths)[number];

const REQUIRED_BY_PATH: Record<string, OrderFormValidationKey> = {
  "contact.name": "requiredName",
  "contact.lastName": "requiredLastName",
  "contact.phone": "requiredPhone",
  "contact.email": "invalidEmail",
  "fulfillment.deliveryAddress": "requiredDeliveryAddress",
  "fulfillment.deliveryAddress.recipientName": "requiredRecipient",
  "fulfillment.deliveryAddress.line1": "requiredLine1",
  "fulfillment.deliveryAddress.district": "requiredDistrict",
  "fulfillment.deliveryAddress.city": "requiredCity",
  "fulfillment.deliveryAddress.province": "requiredProvince",
  "fulfillment.deliveryAddress.phone": "requiredDeliveryPhone",
  lines: "requiredLines",
};

export function sanitizePersonName(value: string): string {
  return value.replace(/[^\p{L} '\-]/gu, "").replace(/ {2,}/g, " ");
}

export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function sanitizeOrderFormValues(
  values: OrderFormValues,
): OrderFormValues {
  return {
    ...values,
    contact: {
      ...values.contact,
      name: sanitizePersonName(values.contact.name),
      lastName: sanitizePersonName(values.contact.lastName),
      phone: sanitizePhone(values.contact.phone),
      email: values.contact.email.replace(/\s/g, ""),
    },
    fulfillment: {
      ...values.fulfillment,
      deliveryAddress: {
        ...values.fulfillment.deliveryAddress,
        recipientName: sanitizePersonName(
          values.fulfillment.deliveryAddress.recipientName,
        ),
        phone: sanitizePhone(values.fulfillment.deliveryAddress.phone),
        city: sanitizePersonName(values.fulfillment.deliveryAddress.city),
        province: sanitizePersonName(
          values.fulfillment.deliveryAddress.province,
        ),
      },
    },
  };
}

function keyForIssue(pathKey: string, issue: ZodIssue): OrderFormValidationKey {
  if (
    pathKey === "contact.name" ||
    pathKey === "contact.lastName" ||
    pathKey === "fulfillment.deliveryAddress.recipientName" ||
    pathKey === "fulfillment.deliveryAddress.city" ||
    pathKey === "fulfillment.deliveryAddress.province"
  ) {
    if (issue.code === "invalid_string") {
      return "invalidName";
    }
    if (issue.code === "too_small") {
      if ("minimum" in issue && issue.minimum === 1) {
        return REQUIRED_BY_PATH[pathKey] ?? "invalidField";
      }
      return "tooShortName";
    }
  }

  if (
    pathKey === "contact.phone" ||
    pathKey === "fulfillment.deliveryAddress.phone"
  ) {
    if (issue.code === "invalid_string") {
      return "invalidPhone";
    }
  }

  if (
    pathKey === "fulfillment.deliveryAddress.line1" &&
    issue.code === "too_small"
  ) {
    if ("minimum" in issue && issue.minimum === 1) {
      return REQUIRED_BY_PATH[pathKey] ?? "invalidField";
    }
    return "tooShortAddress";
  }

  if (REQUIRED_BY_PATH[pathKey]) {
    if (
      issue.code === "too_small" ||
      issue.code === "invalid_type" ||
      issue.code === "invalid_string" ||
      issue.code === "custom"
    ) {
      return REQUIRED_BY_PATH[pathKey];
    }
  }

  if (pathKey === "contact.email" || pathKey.endsWith(".email")) {
    return "invalidEmail";
  }

  if (issue.code === "too_small" && "type" in issue && issue.type === "array") {
    return REQUIRED_BY_PATH.lines ?? "requiredLines";
  }

  return "invalidField";
}

/** Convierte issues de Zod en claves i18n (`orders.form.validation.*`). */
export function zodIssuesToFieldErrorKeys(
  issues: ZodIssue[],
): OrderFormFieldErrorKeys {
  const fieldErrorKeys: OrderFormFieldErrorKeys = {};

  for (const issue of issues) {
    const pathKey = issue.path.join(".");
    if (!pathKey || fieldErrorKeys[pathKey]) continue;
    fieldErrorKeys[pathKey] = keyForIssue(pathKey, issue);
  }

  return fieldErrorKeys;
}

export function mapOrderFormFieldErrorKeys(
  keys: OrderFormFieldErrorKeys,
  translate: (key: OrderFormValidationKey) => string,
): OrderFormFieldErrors {
  const fieldErrors: OrderFormFieldErrors = {};
  for (const [path, key] of Object.entries(keys)) {
    fieldErrors[path] = translate(key);
  }
  return fieldErrors;
}

export function validateCreateOrderForm(
  values: OrderFormValues,
  pickupPoints: PickupPointFormOption[] = [],
):
  | { ok: true; payload: CreateOrderInput }
  | {
      ok: false;
      fieldErrorKeys: OrderFormFieldErrorKeys;
      formErrorKey: "reviewForm";
    } {
  const payload = toCreateOrderPayload(values, pickupPoints);
  const parsed = createOrderInputSchema.safeParse(payload);

  if (parsed.success) {
    return { ok: true, payload: parsed.data };
  }

  return {
    ok: false,
    fieldErrorKeys: zodIssuesToFieldErrorKeys(parsed.error.issues),
    formErrorKey: "reviewForm",
  };
}

export function validateCreateOrderField(
  values: OrderFormValues,
  path: CustomerDeliveryFieldPath,
): OrderFormValidationKey | undefined {
  const validation = validateCreateOrderForm(values);
  return validation.ok ? undefined : validation.fieldErrorKeys[path];
}

import {
  createOrderInputSchema,
  type CreateOrderInput,
} from "@de-tin-marin/validations/order";
import type { ZodIssue } from "zod";
import { toCreateOrderPayload } from "../components/order-form/order-form.helpers";
import type { OrderFormValues } from "../components/order-form/order-form.types";

export type OrderFormFieldErrors = Record<string, string>;

const REQUIRED_BY_PATH: Record<string, string> = {
  "contact.name": "Ingresa el nombre",
  "contact.lastName": "Ingresa el apellido",
  "contact.phone": "Ingresa el teléfono",
  "contact.email": "Ingresa un correo válido",
  "fulfillment.deliveryAddress": "Completa la dirección de entrega",
  "fulfillment.deliveryAddress.recipientName": "Ingresa el destinatario",
  "fulfillment.deliveryAddress.line1": "Ingresa la dirección",
  "fulfillment.deliveryAddress.district": "Selecciona el distrito",
  "fulfillment.deliveryAddress.city": "Ingresa la ciudad",
  "fulfillment.deliveryAddress.province": "Ingresa la provincia",
  "fulfillment.deliveryAddress.phone": "Ingresa el teléfono de entrega",
  lines: "Agrega al menos una línea al carrito",
};

function messageForIssue(pathKey: string, issue: ZodIssue): string {
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
    return "Ingresa un correo válido";
  }

  if (issue.code === "too_small" && "type" in issue && issue.type === "array") {
    return REQUIRED_BY_PATH.lines ?? "Agrega al menos una línea al carrito";
  }

  return "Campo inválido";
}

export function zodIssuesToFieldErrors(
  issues: ZodIssue[],
): OrderFormFieldErrors {
  const fieldErrors: OrderFormFieldErrors = {};

  for (const issue of issues) {
    const pathKey = issue.path.join(".");
    if (!pathKey || fieldErrors[pathKey]) continue;
    fieldErrors[pathKey] = messageForIssue(pathKey, issue);
  }

  return fieldErrors;
}

export function validateCreateOrderForm(
  values: OrderFormValues,
):
  | { ok: true; payload: CreateOrderInput }
  | { ok: false; fieldErrors: OrderFormFieldErrors; formError: string } {
  const payload = toCreateOrderPayload(values);
  const parsed = createOrderInputSchema.safeParse(payload);

  if (parsed.success) {
    return { ok: true, payload: parsed.data };
  }

  const fieldErrors = zodIssuesToFieldErrors(parsed.error.issues);
  return {
    ok: false,
    fieldErrors,
    formError: "Revisa los campos marcados del formulario",
  };
}

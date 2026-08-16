import { z } from "zod";

export const checkoutFormFields = [
  "name",
  "lastName",
  "phone",
  "email",
  "line1",
  "district",
  "city",
  "province",
  "reference",
] as const;

export type CheckoutFormField = (typeof checkoutFormFields)[number];

export type CheckoutFormValues = Record<CheckoutFormField, string>;

export type CheckoutFieldErrors = Partial<Record<CheckoutFormField, string>>;

export type CheckoutFieldErrorKey =
  "required" | "invalidEmail" | "invalidName" | "invalidPhone" | "tooShort";

export type CheckoutValidationLabels = Record<CheckoutFieldErrorKey, string>;

/** Letras (incl. tildes), espacios, guion y apóstrofe — p. ej. María José, Ana-María. */
const PERSON_NAME_RE = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;

/** Celular Perú: 9 dígitos empezando en 9. */
const PERU_MOBILE_RE = /^9\d{8}$/;

const MIN_NAME_LENGTH = 2;
const MIN_ADDRESS_LENGTH = 5;

export function sanitizePersonName(value: string): string {
  return value.replace(/[^\p{L} '\-]/gu, "").replace(/ {2,}/g, " ");
}

export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function sanitizeEmail(value: string): string {
  return value.replace(/\s/g, "");
}

export function sanitizePlaceName(value: string): string {
  return sanitizePersonName(value);
}

export function sanitizeCheckoutField(
  field: CheckoutFormField,
  value: string,
): string {
  switch (field) {
    case "name":
    case "lastName":
      return sanitizePersonName(value);
    case "phone":
      return sanitizePhone(value);
    case "email":
      return sanitizeEmail(value);
    case "city":
    case "province":
      return sanitizePlaceName(value);
    default:
      return value;
  }
}

function personNameField() {
  return z
    .string()
    .trim()
    .min(1, "required")
    .min(MIN_NAME_LENGTH, "tooShort")
    .max(200)
    .regex(PERSON_NAME_RE, "invalidName");
}

export const checkoutFormSchema = z.object({
  name: personNameField(),
  lastName: personNameField(),
  phone: z
    .string()
    .trim()
    .min(1, "required")
    .regex(PERU_MOBILE_RE, "invalidPhone"),
  email: z.string().trim().min(1, "required").email("invalidEmail").max(320),
  line1: z
    .string()
    .trim()
    .min(1, "required")
    .min(MIN_ADDRESS_LENGTH, "tooShort")
    .max(300),
  district: z.string().trim().min(1, "required"),
  city: personNameField(),
  province: personNameField(),
  reference: z.string().max(500),
}) satisfies z.ZodType<CheckoutFormValues>;

export function hasCheckoutFieldError(
  errors: CheckoutFieldErrors,
  field: CheckoutFormField,
): boolean {
  return Object.hasOwn(errors, field);
}

function toErrorKey(message: string): CheckoutFieldErrorKey {
  switch (message) {
    case "invalidEmail":
    case "invalidName":
    case "invalidPhone":
    case "tooShort":
      return message;
    default:
      return "required";
  }
}

export function getCheckoutFieldErrorKeys(
  values: CheckoutFormValues,
): Partial<Record<CheckoutFormField, CheckoutFieldErrorKey>> {
  const result = checkoutFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: Partial<Record<CheckoutFormField, CheckoutFieldErrorKey>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      typeof field !== "string" ||
      !isCheckoutFormField(field) ||
      errors[field]
    ) {
      continue;
    }
    errors[field] = toErrorKey(issue.message);
  }
  return errors;
}

export function getCheckoutFieldErrorKey(
  values: CheckoutFormValues,
  field: CheckoutFormField,
): CheckoutFieldErrorKey | undefined {
  const errorKeys = getCheckoutFieldErrorKeys(values);
  return errorKeys[field];
}

export function mapCheckoutFieldErrors(
  errorKeys: Partial<Record<CheckoutFormField, CheckoutFieldErrorKey>>,
  labels: CheckoutValidationLabels,
): CheckoutFieldErrors {
  const mapped: CheckoutFieldErrors = {};
  for (const field of checkoutFormFields) {
    const key = errorKeys[field];
    if (!key) continue;
    mapped[field] = labels[key];
  }
  return mapped;
}

export function mapCheckoutFieldError(
  _field: CheckoutFormField,
  key: CheckoutFieldErrorKey | undefined,
  labels: CheckoutValidationLabels,
): string | undefined {
  if (!key) return undefined;
  return labels[key];
}

function isCheckoutFormField(value: string): value is CheckoutFormField {
  return checkoutFormFields.includes(value as CheckoutFormField);
}

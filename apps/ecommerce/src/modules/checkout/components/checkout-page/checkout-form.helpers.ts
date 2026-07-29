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

export type CheckoutFieldErrorKey = "required" | "invalidEmail";

export const checkoutFormSchema = z.object({
  name: z.string().trim().min(1, "required"),
  lastName: z.string().trim().min(1, "required"),
  phone: z.string().trim().min(1, "required").max(50),
  email: z.string().trim().min(1, "required").email("invalidEmail"),
  line1: z.string().trim().min(1, "required").max(300),
  district: z.string().trim().min(1, "required"),
  city: z.string().trim().min(1, "required").max(120),
  province: z.string().trim().min(1, "required").max(120),
  reference: z.string().max(500),
}) satisfies z.ZodType<CheckoutFormValues>;

export function hasCheckoutFieldError(
  errors: CheckoutFieldErrors,
  field: CheckoutFormField,
): boolean {
  return Object.hasOwn(errors, field);
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
    errors[field] =
      issue.message === "invalidEmail" ? "invalidEmail" : "required";
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
  labels: {
    required: string;
    invalidEmail: string;
  },
): CheckoutFieldErrors {
  const mapped: CheckoutFieldErrors = {};
  for (const field of checkoutFormFields) {
    const key = errorKeys[field];
    if (!key) continue;
    mapped[field] =
      key === "invalidEmail" ? labels.invalidEmail : labels.required;
  }
  return mapped;
}

export function mapCheckoutFieldError(
  field: CheckoutFormField,
  key: CheckoutFieldErrorKey | undefined,
  labels: {
    required: string;
    invalidEmail: string;
  },
): string | undefined {
  if (!key) return undefined;
  return key === "invalidEmail" ? labels.invalidEmail : labels.required;
}

function isCheckoutFormField(value: string): value is CheckoutFormField {
  return checkoutFormFields.includes(value as CheckoutFormField);
}

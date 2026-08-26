import { z } from "zod";

const optionalIsoDatetime = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const storefrontSettingsSchema = z
  .object({
    freeDelivery: z.boolean(),
    freePickupPoint: z.boolean(),
    freeFulfillmentStartsAt: optionalIsoDatetime,
    freeFulfillmentEndsAt: optionalIsoDatetime,
    minOrderSubtotal: z.number().finite().nonnegative().max(999_999.99),
    announcementEnabled: z.boolean(),
    announcementMessage: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional()
      .transform((value) => {
        if (value == null || value === "") return null;
        return value;
      }),
  })
  .superRefine((value, ctx) => {
    const start = value.freeFulfillmentStartsAt ?? null;
    const end = value.freeFulfillmentEndsAt ?? null;
    if (start && end && new Date(end).getTime() <= new Date(start).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "freeFulfillmentEndsAt must be after freeFulfillmentStartsAt",
        path: ["freeFulfillmentEndsAt"],
      });
    }
    if (
      value.announcementEnabled &&
      (!value.announcementMessage || value.announcementMessage.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "announcementMessage is required when announcement is enabled",
        path: ["announcementMessage"],
      });
    }
  });

/** Public allowlist DTO — same shape for storefront consumers. */
export const publicStorefrontSettingsSchema = storefrontSettingsSchema;

export type StorefrontSettingsInput = z.infer<typeof storefrontSettingsSchema>;
export type PublicStorefrontSettings = z.infer<
  typeof publicStorefrontSettingsSchema
>;

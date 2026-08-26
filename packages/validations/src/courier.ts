import { z } from "zod";

export const courierProvinceSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});

export const courierDestinationSnapshotSchema = z.object({
  departmentId: z.string().uuid(),
  departmentName: z.string().trim().min(1).max(120),
  provinceSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  provinceName: z.string().trim().min(1).max(120),
});

export const courierRecipientSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/),
  fullName: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[\p{L}]+(?:[ '\-][\p{L}]+)+$/u),
  agencyAddress: z.string().trim().min(10).max(500),
});

export const courierSnapshotSchema = z.object({
  destination: courierDestinationSnapshotSchema,
  recipient: courierRecipientSchema,
});

export const courierDepartmentInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  provinces: z.array(courierProvinceSchema).min(1),
  isActive: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateCourierDepartmentInputSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  provinces: z.array(courierProvinceSchema).min(1).optional(),
});

export const createCourierDepartmentInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const checkoutCourierDepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  provinces: z.array(
    z.object({
      slug: courierProvinceSchema.shape.slug,
      name: courierProvinceSchema.shape.name,
    }),
  ),
});

export type CourierProvince = z.infer<typeof courierProvinceSchema>;
export type CourierDestinationSnapshot = z.infer<
  typeof courierDestinationSnapshotSchema
>;
export type CourierRecipient = z.infer<typeof courierRecipientSchema>;
export type CourierSnapshot = z.infer<typeof courierSnapshotSchema>;
export type CourierDepartmentInput = z.infer<
  typeof courierDepartmentInputSchema
>;
export type UpdateCourierDepartmentInput = z.infer<
  typeof updateCourierDepartmentInputSchema
>;
export type CreateCourierDepartmentInput = z.infer<
  typeof createCourierDepartmentInputSchema
>;
export type CheckoutCourierDepartment = z.infer<
  typeof checkoutCourierDepartmentSchema
>;

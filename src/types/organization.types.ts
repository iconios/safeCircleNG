import { z } from "zod";
import { PhoneNumberSchema } from "./user.types.ts";
import { timestamp } from "./emergency.types.ts";

export const organizationStatusEnum = z.enum([
  "active",
  "inactive",
  "suspended",
  "trial",
]);
export const subscriptionTierEnum = z.enum([
  "trial",
  "basic",
  "premium",
  "enterprise",
]);
export type subscriptionTier = z.infer<typeof subscriptionTierEnum>;

export const organizationRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().max(100),
    slug: z.string().trim().max(100),
    company_code: z.string().trim(),
    description: z.string().trim().nullable(),
    contact_email: z.email(),
    contact_phone: PhoneNumberSchema.nullable(),
    contact_person: z.string().trim().max(100),
    status: organizationStatusEnum.default("active"),
    subscription_tier: subscriptionTierEnum.default("trial"),
    max_employees: z.number().int().default(10),
    employee_count: z.number().int().default(0),
    admin_secret_key: z.uuid().nullable(),
    dashboard_url: z.string().nullable(),
    trial_start_date: timestamp.nullable(),
    trial_end_date: timestamp.nullable(),
    created_at: timestamp.nullable(),
    updated_at: timestamp.nullable(),
  })
  .strict();

export const organizationInsertSchema = organizationRowSchema
  .pick({
    name: true,
    description: true,
    contact_email: true,
    contact_phone: true,
    contact_person: true,
  })
  .strict();

export const organizationUpdateSchema = organizationRowSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    name: true,
    slug: true,
    company_code: true,
    contact_person: true,
    dashboard_url: true,
  })
  .partial()
  .strict();

export const organizationDeleteSchema = organizationRowSchema
  .pick({
    id: true,
  })
  .strict();

export type organizationRow = z.infer<typeof organizationRowSchema>;
export type organizationInsert = z.infer<typeof organizationInsertSchema>;
export type organizationUpdate = z.infer<typeof organizationUpdateSchema>;
export type organizationDelete = z.infer<typeof organizationDeleteSchema>;

// Helper function that performs the transformation
const formatString = (input: string): string => {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// If you need to validate that an existing string is already formatted:
export const codeSchema = z
  .string()
  .refine((str) => str === formatString(str), {
    message: "Invalid company code format",
  });

export const organizationInputSchema = z
  .object({
    company_code: codeSchema,
  })
  .strict();
export type organizationInputDTO = z.infer<typeof organizationInputSchema>;

export const deleteOrganizationInputSchema = organizationInputSchema
  .extend({
    organization_id: z.uuid(),
  })
  .strict();

export type deleteOrganizationInputDTO = z.infer<
  typeof deleteOrganizationInputSchema
>;

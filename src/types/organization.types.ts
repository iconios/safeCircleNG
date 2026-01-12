import { z } from "zod";
import { PhoneNumberSchema } from "./user.types.ts";
import { timestamp } from "./emergency.types.ts";

const organizationStatusEnum = z.enum(["active", "inactive", "suspended", "trial"])
const subscriptionTier = z.enum(["trial", "basic", "premium", "enterprise"])

export const organizationRowSchema = z.object({
    id: z.uuid(),
    name: z.string().max(100),
    company_code: z.string().nullable(),
    description: z.string().nullable(),
    contact_email: z.email(),
    contact_phone: PhoneNumberSchema.nullable(),
    contact_person: z.string().max(100),
    status: organizationStatusEnum.default("active"),
    subscription_tier: subscriptionTier.default("trial"),
    max_employees: z.number().int().default(10).nullable(),
    employee_count: z.number().int().default(0).nullable(),
    admin_secret_key: z.uuid().nullable(),
    dashboard_url: z.string().nullable(),
    trial_start_date: timestamp.nullable(),
    trial_end_date: timestamp.nullable(),
    created_at: timestamp.nullable(),
    updated_at: timestamp.nullable()
}).strict();

export const organizationInsertSchema = organizationRowSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
}).strict();

export const organizationUpdateSchema = organizationInsertSchema.partial().strict();

export const organizationDeleteSchema = organizationRowSchema.pick({
    id: true,
}).strict();

export type organizationRow = z.infer<typeof organizationRowSchema>;
export type organizationInsert = z.infer<typeof organizationInsertSchema>;
export type organizationUpdate = z.infer<typeof organizationUpdateSchema>;
export type organizationDelete = z.infer<typeof organizationDeleteSchema>;


import { z } from "zod";

const UserTypeEnum = z.enum(["individual", "employee", "admin"]);
const userStatusEnum = z.enum([
  "pending_verification",
  "active",
  "inactive",
  "suspended",
]);
const UserSubscriptionTierEnum = z.enum(["free", "family", "corporate"]);
export const PhoneNumberSchema = z.string().regex(/^234\d{10}$/);
export const VerificationCodeSchema = z.string().regex(/^\d{6}$/);

export const UserRowSchema = z.object({
  id: z.uuid(),
  phone_number: PhoneNumberSchema,
  phone_verified: z.boolean().default(false),
  last_otp_requested_at: z.iso.datetime().nullable(),
  otp_locked_until: z.iso.datetime().nullable(),
  failed_attempt_count: z.number().int().min(0).default(0).nullable(),
  email: z.email().nullable(),
  first_name: z.string().min(2).max(100).nullable(),
  profile_image_url: z.url().nullable(),
  user_type: UserTypeEnum.default("individual").nullable(),
  subscription_tier: UserSubscriptionTierEnum.default("free").nullable(),
  subscription_expires_at: z.iso.datetime().nullable(),
  last_login_at: z.iso.datetime().nullable(),
  profile_completion_score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(10)
    .nullable(),
  fcm_token: z.string().nullable(),
  device_id: z.string().length(255).nullable(),
  status: userStatusEnum.default("pending_verification").nullable(),
  location_sharing_consent: z.boolean().default(true).nullable(),
  created_at: z.iso.datetime().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const UserInsertSchema = UserRowSchema.pick({
  id: true,
  phone_number: true,
  phone_verified: true,
  user_type: true,
  subscription_tier: true,
  subscription_expires_at: true,
  device_id: true,
  status: true,
});

export const UserUpdateSchema = UserRowSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const UserDeleteSchema = UserRowSchema.pick({
  id: true,
});

export type UserRow = z.infer<typeof UserRowSchema>;
export type UserInsert = z.infer<typeof UserInsertSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserDelete = z.infer<typeof UserDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        insert: UserInsert;
        update: UserUpdate;
        delete: UserDelete;
      };
    };
  };
}

const ReadUserDTOSchema = UserRowSchema.pick({
  id: true,
  email: true,
  first_name: true,
  phone_number: true,
  phone_verified: true,
  user_type: true,
  subscription_tier: true,
  last_login_at: true,
  status: true,
});

export type ReadUserDTO = z.infer<typeof ReadUserDTOSchema>;

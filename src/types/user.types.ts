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
  last_otp_requested_at: z.iso.datetime(),
  otp_locked_until: z.iso.datetime(),
  failed_attempt_count: z.number().int().min(0).default(0),
  email: z.email(),
  first_name: z.string().min(2).max(100),
  profile_image_url: z.url(),
  user_type: UserTypeEnum.default("individual"),
  subscription_tier: UserSubscriptionTierEnum.default("free"),
  subscription_expires_at: z.iso.datetime().nullable(),
  last_login_at: z.iso.datetime(),
  profile_completion_score: z.number().int().min(0).max(100).default(10),
  fcm_token: z.string(),
  device_id: z.string().length(255),
  status: userStatusEnum.default("pending_verification"),
  location_sharing_consent: z.boolean().default(true),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
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
})
  .partial()

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

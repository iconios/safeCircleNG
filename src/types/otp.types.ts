import { z } from "zod";
import { timestamp } from "./emergency.types.ts";
import { PhoneNumberSchema } from "./user.types.ts";

export const otpTypeEnum = z.enum(["signup", "login"]);
const otpStatusEnum = z.enum(["pending", "verified", "expired", "failed"]);
export type otpType = z.infer<typeof otpTypeEnum>;

export const otpRowSchema = z
  .object({
    id: z.uuid(),
    created_at: timestamp,
    phone_number: PhoneNumberSchema,
    user_id: z.uuid(),
    otp_code: z.string().nullable(),
    type: otpTypeEnum,
    status: otpStatusEnum.default("pending"),
    attempts: z.number().int().default(0),
    max_attempts: z.number().int().default(3),
    expires_at: timestamp.nullable(),
    verified_at: timestamp.nullable(),
    last_attempt_at: timestamp.nullable(),
    ip_address: z.string().nullable(),
  })
  .strict();

export const otpInsertSchema = otpRowSchema
  .pick({
    type: true,
  })
  .strict();

export const otpUpdateSchema = otpRowSchema
  .omit({
    id: true,
    created_at: true,
  })
  .partial();

export const otpDeleteSchema = otpRowSchema
  .pick({
    phone_number: true,
  })
  .strict();

export type otpInsert = z.infer<typeof otpInsertSchema>;
export type otpUpdate = z.infer<typeof otpUpdateSchema>;
export type otpDelete = z.infer<typeof otpDeleteSchema>;
export type otpRow = z.infer<typeof otpRowSchema>;

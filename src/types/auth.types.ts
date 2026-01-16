import { z } from "zod";
import { PhoneNumberSchema, VerificationCodeSchema } from "./user.types.ts";
import { Request } from "express";

export const SignUpDataDTOSchema = z
  .object({
    phone_number: PhoneNumberSchema,
    device_id: z.string(),
  })
  .strict();

export type SignUpDataDTO = z.infer<typeof SignUpDataDTOSchema>;

export const VerifyOtpDataSchema = z
  .object({
    phone_number: PhoneNumberSchema,
    otp: VerificationCodeSchema,
  })
  .strict();

export type VerifyOtpDataDTO = z.infer<typeof VerifyOtpDataSchema>;

export interface AuthRequest extends Request {
  token?: string;
  userId?: string;
}

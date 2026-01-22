import { z } from "zod";
import { PhoneNumberSchema, VerificationCodeSchema } from "./user.types";
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
    device_id: z.string(),
  })
  .strict();

export const loginInputDataSchema = z
  .object({
    phone_number: PhoneNumberSchema,
  })
  .strict();

export type VerifyOtpDataDTO = z.infer<typeof VerifyOtpDataSchema>;
export type loginInputDTO = z.infer<typeof loginInputDataSchema>;

export interface AuthRequest extends Request {
  token?: string;
  userId?: string;
}

export const tokenPayloadSchema = z
  .object({
    userId: z.string(),
    phoneNumber: z.string(),
    email: z.string().nullable(),
    firstName: z.string().nullable(),
  })
  .strict();

export type tokenPayload = z.infer<typeof tokenPayloadSchema>;

import { z } from "zod";
import { PhoneNumberSchema } from "./user.types";

export const SignUpDataDTOSchema = z
  .object({
    phone_number: PhoneNumberSchema,
    device_id: z.string(),
  })
  .strict();

export type SignUpDataDTO = z.infer<typeof SignUpDataDTOSchema>;

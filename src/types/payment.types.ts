import { z } from "zod";
import { timestamp } from "./emergency.types.ts";
import { PhoneNumberSchema } from "./user.types.ts";

const currencySchema = z.string().regex(/^\d+(\.\d{1,2})?$/);
const paymentMethodEnum = z.enum([
  "card",
  "bank_transfer",
  "ussd",
  "mobile_money",
]);
const statusEnum = z.enum([
  "pending",
  "successful",
  "failed",
  "refunded",
  "cancelled",
]);
const productTypeEnum = z.enum(["subscription", "one_time", "corporate"]);

const paymentRowSchema = z
  .object({
    id: z.uuid(),
    created_at: timestamp.nullable(),
    user_id: z.uuid(),
    transaction_id: z.uuid(),
    reference: z.string(),
    amount_ngn: currencySchema,
    currency: z.string().default("NGN"),
    payment_method: paymentMethodEnum,
    payment_provider: z.string().default("flutterwave"),
    status: statusEnum,
    customer_email: z.email(),
    customer_phone: PhoneNumberSchema,
    product_type: productTypeEnum,
    product_id: z.uuid(),
    description: z.string().nullable(),
    initiated_at: timestamp,
    completed_at: timestamp.nullable(),
    metadata: z.json().nullable(),
    ip_address: z.string().nullable(),
    updated_at: timestamp.nullable(),
  })
  .strict();

export const paymentInsertSchema = paymentRowSchema
  .pick({
    transaction_id: true,
    reference: true,
    amount_ngn: true,
    currency: true,
    payment_method: true,
    payment_provider: true,
    status: true,
    customer_email: true,
    customer_phone: true,
    product_type: true,
    initiated_at: true,
    product_id: true,
  })
  .extend({
    completed_at: timestamp.optional(),
    metadata: z.json().optional(),
    ip_address: z.string().optional(),
    description: z.string().optional(),
  })
  .strict();

export const paymentUpdateSchema = paymentRowSchema
  .omit({
    id: true,
    user_id: true,
  })
  .optional();

export const paymentDeleteSchema = paymentRowSchema
  .pick({
    id: true,
  })
  .strict();

export type paymentRow = z.infer<typeof paymentRowSchema>;
export type paymentInsert = z.infer<typeof paymentInsertSchema>;
export type paymentUpdate = z.infer<typeof paymentUpdateSchema>;
export type paymentDelete = z.infer<typeof paymentDeleteSchema>;

export const paymentInputSchema = z
  .object({
    user_id: z.uuid(),
  })
  .strict();

export type paymentInputDTO = z.infer<typeof paymentInputSchema>;

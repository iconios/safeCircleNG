import { z } from "zod";
import { timestamp } from "./emergency.types.ts";

const tierEnum = z.enum(["free", "family", "corporate"]);
const statusEnum = z.enum(["active", "cancelled", "expired", "pending"]);
const periodTypeEnum = z.enum(["monthly", "yearly"]);

export const subscriptionRowSchema = z
  .object({
    id: z.uuid(),
    user_id: z.uuid(),
    tier: tierEnum,
    status: statusEnum,
    period_type: periodTypeEnum,
    start_date: timestamp,
    end_date: timestamp,
    payment_id: z.uuid().nullable(),
    auto_renew: z.boolean().default(false).nullable(),
    max_circle_members: z.number().int(),
    max_journeys_per_week: z.number().int().nullable(),
    journey_history_days: z.number().int().nullable(),
    created_at: timestamp.nullable(),
    updated_at: timestamp.nullable(),
  })
  .strict();

export const subscriptionInsertSchema = subscriptionRowSchema
  .omit({
    id: true,
    user_id: true,
  })
  .extend({
    payment_id: z.uuid().optional(),
    auto_renew: z.boolean().default(false).optional(),
    max_circle_members: z.number().int().optional(),
    max_journeys_per_week: z.number().int().optional(),
    journey_history_days: z.number().int().optional(),
    created_at: timestamp.optional(),
    updated_at: timestamp.optional(),
  })
  .strict();

export const subscriptionUpdateSchema = z
  .object({
    status: statusEnum.optional(),
    period_type: periodTypeEnum.optional(),
    start_date: timestamp.optional(),
    end_date: timestamp.optional(),
    payment_id: z.uuid().optional(),
    auto_renew: z.boolean().default(false).optional(),
    max_circle_members: z.number().int().optional(),
    max_journeys_per_week: z.number().int().optional(),
    journey_history_days: z.number().int().optional(),
    created_at: timestamp.optional(),
    updated_at: timestamp.optional(),
  })
  .strict();

export const subscriptionDeleteSchema = z
  .object({
    id: true,
  })
  .strict();

export type subscriptionRow = z.infer<typeof subscriptionRowSchema>;
export type subscriptionInsert = z.infer<typeof subscriptionInsertSchema>;
export type subscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>;
export type subscriptionDelete = z.infer<typeof subscriptionDeleteSchema>;

export const subscriptionInputSchema = z
  .object({
    user_id: z.uuid(),
  })
  .strict();

export type subscriptionInputDTO = z.infer<typeof subscriptionInputSchema>;

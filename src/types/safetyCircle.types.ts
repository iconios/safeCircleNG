import { z } from "zod";
import { PhoneNumberSchema } from "./user.types";
import { timestamp } from "./emergency.types";

export const SafetyCircleRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  contact_phone: PhoneNumberSchema,
  is_verified: z.boolean().default(false).nullable(),
  verification_sent_at: z.iso.datetime().nullable(),
  last_alert_at: z.iso.datetime().nullable(),
  contact_name: z.string().min(2).max(20),
  relationship: z.string().min(2).max(20).nullable(),
  is_active: z.boolean().default(true).nullable(),
  is_primary: z.boolean().default(false).nullable(),
  receive_sms: z.boolean().default(true).nullable(),
  receive_email: z.boolean().default(false).nullable(),
  created_at: z.iso.datetime().nullable(),
  updated_at: z.iso.datetime().nullable(),
  total_alerts_received: z.number().int().min(0).default(0),
});

export const SafetyCircleInsertSchema = SafetyCircleRowSchema.pick({
  id: true,
  contact_phone: true,
  contact_name: true,
  user_id: true,
})
  .extend({
    relationship: z.string(),
  })
  .strict();

export const SafetyCircleUpdateSchema = SafetyCircleRowSchema.omit({
  created_at: true,
  updated_at: true,
  user_id: true,
  id: true,
}).partial();

export const SafetyCircleDeleteSchema = SafetyCircleRowSchema.pick({
  id: true,
}).strict();

export type SafetyCircleRow = z.infer<typeof SafetyCircleRowSchema>;
export type SafetyCircleInsert = z.infer<typeof SafetyCircleInsertSchema>;
export type SafetyCircleUpdate = z.infer<typeof SafetyCircleUpdateSchema>;
export type SafetyCircleDelete = z.infer<typeof SafetyCircleDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      safety_circles: {
        Row: SafetyCircleRow;
        insert: SafetyCircleInsert;
        update: SafetyCircleUpdate;
        delete: SafetyCircleDelete;
      };
    };
  };
}

export const CreateCircleDataSchema = SafetyCircleRowSchema.pick({
  contact_name: true,
  contact_phone: true,
})
  .extend({
    relationship: z.string().min(2).max(20),
  })
  .strict();

export type CreateCircleDataDTO = z.infer<typeof CreateCircleDataSchema>;

export const alertCircleInputSchema = z
  .object({
    user_id: z.uuid(),
    journey_id: z.uuid(),
    emergency_id: z.uuid().nullable(),
  })
  .strict();

export type alertCircleInput = z.infer<typeof alertCircleInputSchema>;

export const alertSMSResponseSchema = z
  .object({
    contactName: z.string(),
    contactPhone: z.string(),
    circleMemberId: z.uuid(),
  })
  .strict();

export type alertSMSResponse = z.infer<typeof alertSMSResponseSchema>;

export const alertMessageTypeSchema = z.enum([
  "emergency",
  "missed_checkin",
  "journey_start",
  "journey_end",
  "circle_invite",
  "extension_granted",
]);
export type alertMessageType = z.infer<typeof alertMessageTypeSchema>;

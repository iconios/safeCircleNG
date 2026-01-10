import { z } from "zod";
import { timestamp } from "./emergency.types.ts";
import { PhoneNumberSchema } from "./user.types.ts";

const recipientTypeEnum = z.enum([
  "circle_member",
  "organization",
  "emergency_services",
]);
const alertMethodEnum = z.enum(["sms", "email", "push"]);
const responseTypeEnum = z.enum(["extend", "called_police", "called_user"]);

export const emergencyAlertsRowSchema = z
  .object({
    id: z.uuid(),
    created_at: timestamp,
    emergency_id: z.uuid(),
    recipient_type: recipientTypeEnum.nullable(),
    recipient_id: z.uuid().nullable(),
    recipient_phone: PhoneNumberSchema.nullable(),
    alert_method: alertMethodEnum.nullable(),
    message_sent: z.string().max(255).nullable(),
    web_link_sent: z.string().max(255).nullable(),
    delivered_at: timestamp.nullable(),
    sent_at: timestamp.nullable(),
    read_at: timestamp.nullable(),
    response_received: z.boolean().default(false).nullable(),
    response_type: responseTypeEnum.nullable(),
    response_notes: z.string().max(255).nullable(),
  })
  .strict();

export const emergencyAlertsInsertSchema = emergencyAlertsRowSchema
  .omit({
    id: true,
    emergency_id: true,
  })
  .strict();

export const emergencyAlertsDeleteSchema = emergencyAlertsRowSchema
  .pick({
    id: true,
  })
  .strict();

export type emergencyAlertsRow = z.infer<typeof emergencyAlertsRowSchema>;
export type emergencyAlertsInsert = z.infer<typeof emergencyAlertsInsertSchema>;
export type emergencyAlertsDelete = z.infer<typeof emergencyAlertsDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      emergency_alerts: {
        Row: emergencyAlertsRow;
        insert: emergencyAlertsInsert;
        delete: emergencyAlertsDelete;
      };
    };
  };
}

export const emergencyAlertsInputSchema = z
  .object({
    user_id: z.uuid(),
    emergency_id: z.uuid(),
  })
  .strict();

export type emergencyAlertInputDTO = z.infer<typeof emergencyAlertsInputSchema>;

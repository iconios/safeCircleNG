import { z } from "zod";
import { decimalLatCoordinate, decimalLngCoordinate } from "./journey.types.ts";

const emergencyTypeEnum = z.enum(["sos", "manual", "missed_checkin"]);
const triggerMethodEnum = z.enum(["shake", "button", "auto"]);
export const locationName = z.string().min(2).max(200);
export const timestamp = z.iso.datetime();
const resolutionTypeEnum = z.enum([
  "user_cancelled",
  "circle_resolved",
  "timeout",
  "false_alarm",
]);

export const emergencyRowSchema = z.object({
  id: z.uuid(),
  journey_id: z.uuid(),
  user_id: z.uuid(),
  emergency_token: z.uuid(),
  emergency_type: emergencyTypeEnum,
  triggered_at: z.iso.datetime(),
  trigger_method: triggerMethodEnum,
  trigger_location_name: locationName,
  trigger_latitude: decimalLatCoordinate,
  trigger_longitide: decimalLngCoordinate,
  resolved_at: timestamp.nullable(),
  resolution_type: resolutionTypeEnum.nullable(),
  resolution_notes: z.string().max(255).nullable(),
  resolved_by: z.uuid().nullable(),
  total_alerts_sent: z.number().int().min(0).nullable(),
  total_circle_members_notified: z.number().int().min(0).nullable(),
  police_notified: z.boolean().default(false).nullable(),
  police_notification_time: timestamp.nullable(),
  created_at: timestamp.nullable(),
  updated_at: timestamp.nullable(),
});

export const emergencyInsertSchema = emergencyRowSchema
  .pick({
    emergency_token: true,
    emergency_type: true,
    triggered_at: true,
    trigger_method: true,
    trigger_location_name: true,
    trigger_latitude: true,
    trigger_longitide: true,
  })
  .strict();

export const emergencyUpdateSchema = emergencyRowSchema
  .omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
  })
  .partial()
  .strict();

export const emergencyDeleteSchema = emergencyRowSchema.pick({
  id: true,
});

export type emergencyRow = z.infer<typeof emergencyRowSchema>;
export type emergencyInsert = z.infer<typeof emergencyInsertSchema>;
export type emergencyUpdate = z.infer<typeof emergencyUpdateSchema>;
export type emergencyDelete = z.infer<typeof emergencyDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      emergencies: {
        Row: emergencyRow;
        insert: emergencyInsert;
        update: emergencyUpdate;
        delete: emergencyDelete;
      };
    };
  };
}

export const emergencyInputSchema = z
  .object({
    user_id: z.uuid(),
    journey_id: z.uuid(),
  })
  .strict();

export type emergencyInputDTO = z.infer<typeof emergencyInputSchema>;

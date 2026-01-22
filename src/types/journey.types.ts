import { z } from "zod";

export const journeyTypeEnum = z.enum(["personal", "corporate", "event"]);
export const journeyStatusEnum = z.enum([
  "active",
  "completed",
  "emergency",
  "cancelled",
  "missed_checkin",
]);
export const batteryLevel = z.number().int().min(0).max(100);
export const decimalLatCoordinate = z
  .object({
    lat: z.coerce
      .number() // Auto-convert strings if needed
      .gte(-90, "Latitude must be ≥ -90°")
      .lte(90, "Latitude must be ≤ 90°")
      .refine((val) => !Number.isNaN(val), "Invalid latitude value"),
  })
  .strict();
export const decimalLngCoordinate = z
  .object({
    lng: z.coerce
      .number() // Auto-convert strings if needed
      .gte(-180, "Longitude must be ≥ -180°")
      .lte(180, "Longitude must be ≤ 180°")
      .refine((val) => !Number.isNaN(val), "Invalid longitude value"),
  })
  .strict();

export const JourneyRowSchema = z.object({
  journey_id: z.uuid(),
  user_id: z.uuid(),
  journey_token: z.uuid(),
  journey_type: journeyTypeEnum.default("personal"),
  status: journeyStatusEnum.default("active"),
  start_location_name: z.string().min(2).max(100),
  start_latitude: decimalLatCoordinate,
  start_longitude: decimalLngCoordinate,
  start_address: z.string().max(255),
  destination_name: z.string().min(2).max(100),
  destination_latitude: decimalLatCoordinate,
  destination_longitude: decimalLngCoordinate,
  destination_address: z.string().max(255),
  started_at: z.iso.datetime(),
  estimated_arrival_at: z.iso.datetime().nullable(),
  check_in_deadline: z.iso.datetime().nullable(),
  completed_at: z.iso.datetime().nullable(),
  terminated_at: z.iso.datetime().nullable(),
  termination_reason: z.string(),
  actual_duration_minutes: z.number().int().min(0).default(0),
  share_with_circle: z.boolean().default(false),
  share_with_organization: z.boolean().default(false),
  share_with_event: z.boolean().default(false),
  extensions_count: z.number().int().min(0).default(0),
  total_extension_minutes: z.number().min(0).default(0),
  metadata: z.string().nullable(),
  organization_id: z.uuid().nullable(),
  event_id: z.uuid().nullable(),
  distance_km: z.number().min(0).default(0),
  battery_start: batteryLevel,
  battery_end: batteryLevel.nullable(),
  created_at: z.iso.datetime().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const JourneyInsertSchema = JourneyRowSchema.pick({
  status: true,
  start_location_name: true,
  start_latitude: true,
  start_longitude: true,
  start_address: true,
  destination_name: true,
  destination_latitude: true,
  destination_longitude: true,
  destination_address: true,
  started_at: true,
  metadata: true,
  battery_start: true,
}).strict();

export const JourneyUpdateSchema = JourneyRowSchema.omit({
  created_at: true,
  updated_at: true,
  journey_id: true,
  user_id: true,
  journey_token: true,
})
  .partial()
  .strict();

export const JourneyDeleteSchema = JourneyRowSchema.pick({
  journey_id: true,
}).strict();

export type JourneyRow = z.infer<typeof JourneyRowSchema>;
export type JourneyInsert = z.infer<typeof JourneyInsertSchema>;
export type JourneyUpdate = z.infer<typeof JourneyUpdateSchema>;
export type JourneyDelete = z.infer<typeof JourneyDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      journeys: {
        Row: JourneyRow;
        insert: JourneyInsert;
        update: JourneyUpdate;
        delete: JourneyDelete;
      };
    };
  };
}

export const journeyInputSchema = z
  .object({
    user_id: z.uuid(),
    journey_id: z.uuid(),
  })
  .strict();

export type journeyInputDTO = z.infer<typeof journeyInputSchema>;

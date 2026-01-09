import { z } from "zod";
import {
  batteryLevel,
  decimalLatCoordinate,
  decimalLngCoordinate,
} from "./journey.types.ts";
import { timestamp } from "./emergency.types.ts";

export const networkType = z.enum(["2g", "3g", "4g", "gprs", "unknown"]);

export const journeyLocationRowSchema = z
  .object({
    id: z.uuid(),
    journey_id: z.uuid(),
    latitude: decimalLatCoordinate,
    longitude: decimalLngCoordinate,
    accuracy_in_meters: z.number().nullable(),
    altitude: z.number().nullable(),
    speed_in_kmh: z.number(),
    battery_level: batteryLevel.nullable(),
    is_charging: z.boolean().default(false),
    network_type: networkType.nullable(),
    recorded_at: timestamp.nullable(),
    created_at: timestamp.nullable(),
  })
  .strict();

export const journeyLocationInsertSchema = journeyLocationRowSchema
  .pick({
    latitude: true,
    longitude: true,
    speed_in_kmh: true,
    is_charging: true,
    recorded_at: true,
    accuracy_in_meters: true,
    altitude: true,
    network_type: true,
    battery_level: true,
  })
  .strict();

export const journeyLocationUpdateSchema = journeyLocationRowSchema
  .omit({
    id: true,
  })
  .partial()
  .strict();

export const journeyLocationDeleteSchema = journeyLocationRowSchema.pick({
  id: true,
}).strict;

export type journeyLocationRow = z.infer<typeof journeyLocationRowSchema>;
export type journeyLocationInsert = z.infer<typeof journeyLocationInsertSchema>;
export type journeyLocationUpdate = z.infer<typeof journeyLocationUpdateSchema>;
export type journeyLocationDelete = z.infer<typeof journeyLocationDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      journey_locations: {
        Row: journeyLocationRow;
        insert: journeyLocationInsert;
        update: journeyLocationUpdate;
        delete: journeyLocationDelete;
      };
    };
  };
}

export const journeyLocationInputSchema = z
  .object({
    user_id: z.uuid(),
    journey_location_id: z.uuid(),
  })
  .strict();

export type journeyLocationInputDTO = z.infer<
  typeof journeyLocationInputSchema
>;

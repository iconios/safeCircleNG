import { z } from "zod";
import { timestamp } from "./emergency.types.ts";
import { decimalLatCoordinate, decimalLngCoordinate } from "./journey.types.ts";
import { codeSchema } from "./organization.types.ts";

export const eventRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string().max(200),
    description: z.string().max(255).nullable(),
    event_code: z.string(),
    slug: z.string(),
    start_time: timestamp,
    end_time: timestamp,
    is_active: z.boolean().default(true),
    organizer_name: z.string().max(200),
    organizer_contact: z.string().max(255),
    organizer_email: z.email().nullable(),
    max_participants: z.number().int().default(50),
    participant_count: z.number().int().default(0),
    admin_secret_key: z.uuid(),
    dashboard_url: z.url(),
    venue_name: z.string().max(200).nullable(),
    venue_address: z.string().max(255),
    venue_latitude: decimalLatCoordinate,
    venue_longitude: decimalLngCoordinate,
    created_at: timestamp,
    updated_at: timestamp.nullable(),
  })
  .strict();

export const eventInsertSchema = eventRowSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    start_time: true,
    end_time: true,
    is_active: true,
    event_code: true,
    max_participants: true,
    participant_count: true,
    admin_secret_key: true,
    dashboard_url: true,
    slug: true,
  })
  .strict();

export const eventUpdateSchema = eventRowSchema
  .omit({
    id: true,
    event_code: true,
    dashboard_url: true,
    created_at: true,
    updated_at: true,
  })
  .partial()
  .strict();

export const eventDeleteSchema = eventRowSchema
  .pick({
    id: true,
    event_code: true,
  })
  .strict();

export type eventRow = z.infer<typeof eventRowSchema>;
export type eventInsert = z.infer<typeof eventInsertSchema>;
export type eventUpdate = z.infer<typeof eventUpdateSchema>;
export type eventDelete = z.infer<typeof eventDeleteSchema>;

export const eventInputSchema = z
  .object({
    event_code: codeSchema,
  })
  .strict();

export type eventInputDTO = z.infer<typeof eventInputSchema>;

export const deleteEventInputSchema = eventInputSchema
  .extend({
    event_id: z.uuid(),
  })
  .strict();

export type deleteEventInput = z.infer<typeof deleteEventInputSchema>;

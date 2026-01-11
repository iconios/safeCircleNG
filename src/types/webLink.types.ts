import { z } from "zod";
import { timestamp } from "./emergency.types.ts";
import { decimalLatCoordinate, decimalLngCoordinate } from "./journey.types.ts";

const webLinkTypeEnum = z.enum(["emergency", "journey"]);
const deviceTypeEnum = z.enum(["mobile", "desktop", "tablet"]);

export const webLinkAccessRowSchema = z
  .object({
    id: z.uuid(),
    journey_id: z.uuid(),
    emergency_id: z.uuid(),
    web_link_token: z.uuid(),
    web_link_type: webLinkTypeEnum,
    accessed_at: timestamp.nullable(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),
    device_type: deviceTypeEnum.nullable(),
    browser_name: z.string().nullable(),
    viewer_latitude: decimalLatCoordinate.nullable(),
    viewer_longitude: decimalLngCoordinate.nullable(),
    session_id: z.uuid().nullable(),
    first_access_in_session: z.boolean().nullable(),
    called_user: z.boolean().nullable(),
    extended_time: z.boolean().nullable(),
    called_emergency_services: z.boolean().nullable(),
    created_at: timestamp.nullable(),
  })
  .strict();

export const webLinkAccessInsertSchema = webLinkAccessRowSchema
  .pick({
    web_link_token: true,
    web_link_type: true,
  })
  .strict();

export const webLinkAccessUpdateSchema = webLinkAccessRowSchema
  .omit({
    journey_id: true,
    emergency_id: true,
    web_link_token: true,
    web_link_type: true,
  })
  .strict();

export const webLinkAccessDeleteSchema = webLinkAccessRowSchema
  .pick({
    id: true,
  })
  .strict();

export type webLinkAccessRow = z.infer<typeof webLinkAccessRowSchema>;
export type webLinkAccessInsert = z.infer<typeof webLinkAccessInsertSchema>;
export type webLinkAccessUpdate = z.infer<typeof webLinkAccessUpdateSchema>;
export type webLinkAccessDelete = z.infer<typeof webLinkAccessDeleteSchema>;

export interface Database {
  public: {
    Tables: {
      web_link_access: {
        Row: webLinkAccessRow;
        insert: webLinkAccessInsert;
        update: webLinkAccessUpdate;
        delete: webLinkAccessDelete;
      };
    };
  };
}

export const webLinkAccessInputSchema = z
  .object({
    user_id: z.uuid(),
    journey_id: z.uuid(),
    emergency_id: z.uuid(),
  })
  .strict();

export type webLinkAccessInputDTO = z.infer<typeof webLinkAccessInputSchema>;

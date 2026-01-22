import { z } from "zod";
import { timestamp } from "./emergency.types";
import { decimalLatCoordinate, decimalLngCoordinate } from "./journey.types";

export const webLinkTypeEnum = z.enum(["emergency", "journey"]);
export type webLinkTypeEnumDTO = z.infer<typeof webLinkTypeEnum>;
const deviceTypeEnum = z.enum(["mobile", "desktop", "tablet"]);

export const webLinkAccessRowSchema = z
  .object({
    id: z.uuid(),
    journey_id: z.uuid(),
    emergency_id: z.uuid().nullable(),
    web_link_token: z.string(),
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
    emergency_id: z.uuid().nullable(),
    count: z.number().int().min(1),
  })
  .strict();

export type webLinkAccessInputDTO = z.infer<typeof webLinkAccessInputSchema>;

export const webLinkSchema = z
  .object({
    journey_id: z.uuid(),
    emergency_id: z.uuid().nullable(),
    web_link_type: webLinkTypeEnum,
    web_link_token: z.string(),
  })
  .strict();

export type webLinkDTO = z.infer<typeof webLinkSchema>;

export const webLinkTokenSchema = z.object({
  id: z.uuid(),
  web_link_token: z.string(),
});

export type webLinkToken = z.infer<typeof webLinkTokenSchema>;

export const createWebLinkAccessServiceResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(webLinkTokenSchema).nullable(),
  error: z
    .object({
      code: z.string(),
      details: z.string(),
    })
    .nullable(),
  metadata: z.object({
    timestamp: z.iso.datetime(),
    user_id: z.string().optional(),
    journey_id: z.string().optional(),
    emergency_id: z.string().nullable().optional(),
  }),
});

export type createWebLinkAccessServiceResponse = z.infer<
  typeof createWebLinkAccessServiceResponseSchema
>;

import  { z } from "zod";
import { timestamp } from "./emergency.types.ts";
import { decimalLatCoordinate, decimalLngCoordinate } from "./journey.types.ts";

const webLinkTypeEnum = z.enum(["emergency", "journey"]);
const deviceTypeEnum = z.enum(["mobile", "desktop", "tablet"]);

export const webLinkAccessRowSchema = z.object({
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
}).strict();
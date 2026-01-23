import { z } from "zod";
import { timestamp } from "./emergency.types";
import { PhoneNumberSchema } from "./user.types";

export const channelTypeEnum = z.enum(["sms", "email"]);

export const messageTypeEnum = z.enum([
  "journey_start",
  "journey_end",
  "emergency",
  "missed_checkin",
  "verification",
  "circle_invite",
  "extension_granted",
]);
export type messageType = z.infer<typeof messageTypeEnum>;

export const deliveryStatusEnum = z.enum([
  "pending",
  "sent",
  "failed",
  "delivered",
  "read",
  "rejected",
]);

export const messageLogsRowSchema = z
  .object({
    id: z.uuid(),
    created_at: timestamp,
    journey_id: z.uuid(),
    emergency_id: z.uuid().nullable(),
    user_id: z.uuid(),
    to_number: PhoneNumberSchema,
    to_name: z.string().max(200).nullable(),
    channel_type: channelTypeEnum.default("sms"),
    message_type: messageTypeEnum,
    message_text: z.string(),
    web_link: z.string().nullable(),
    web_link_token: z.uuid().nullable(),
    delivery_status: deliveryStatusEnum.default("pending"),
    provider_message_id: z.string().max(100).nullable(),
    provider_status: z.string().nullable(),
    sent_at: timestamp.nullable(),
    delivered_at: timestamp.nullable(),
    read_at: timestamp.nullable(),
    estimated_cost_ngn: z.number().nullable(),
    updated_at: timestamp,
  })
  .strict();

export const messageLogsInsertArraySchema = z.array(
  messageLogsRowSchema
    .pick({
      journey_id: true,
      emergency_id: true,
      to_number: true,
      to_name: true,
      channel_type: true,
      message_type: true,
      message_text: true,
      web_link: true,
      web_link_token: true,
      delivery_status: true,
    })
    .strict(),
);

export const messageLogsUpdateSchema = messageLogsRowSchema.omit({
  created_at: true,
  updated_at: true,
  id: true,
});

export type messageLogsRow = z.infer<typeof messageLogsRowSchema>;
export type messageLogsArrayInsert = z.infer<
  typeof messageLogsInsertArraySchema
>;
export type messageLogsUpdate = z.infer<typeof messageLogsUpdateSchema>;

export const smsResponseDataSchema = z.object({
  to_number: z.string(),
  to_name: z.string(),
  delivery_status: deliveryStatusEnum,
  web_link: z.string(),
  web_link_token: z.string(),
  message_text: z.string(),
});

export type smsResponseData = z.infer<typeof smsResponseDataSchema>;
